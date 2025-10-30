const express = require('express')
const router = express.Router()
const Post = require('../models/Posts')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { authenticateToken } = require('../middlewares/auth')
const { deleteObject } = require('../src/s3') // 🆕 추가: S3 삭제 유틸 임포트

const S3_BASE_URL =
  process.env.S3_BASE_URL ||
  `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`

function joinS3Url(base, key) {
  const b = String(base || '').replace(/\/+$/, '')
  const k = String(key || '').replace(/^\/+/, '')
  return `${b}/${k}`
}

// 🆕 추가: 절대 URL → key 변환 헬퍼(DELETE/PUT 비교용)
function urlToKey(u) {
  if (!u) return ''
  const s = String(u)
  if (!/^https?:\/\//i.test(s)) return s // 이미 key
  const base = String(S3_BASE_URL || '').replace(/\/+$/, '')
  return s.startsWith(base + '/') ? s.slice(base.length + 1) : s
}

const toArray = (val) => {
  if (!val) return []
  if (Array.isArray(val)) return val.filter(Boolean)
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [val]
    } catch {
      return [val]
    }
  }
  return []
}

const ensureObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: '잘못된 id 형식입니다.' })
  }
  next()
}

const pickDefined = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))

// CREATE
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, fileUrl, imageUrl } = req.body

    let files = toArray(fileUrl)
    if (!files.length && imageUrl) files = toArray(imageUrl)

    const uid = req.user._id || req.user.id
    const latest = await Post.findOne({ user: uid }).sort({ number: -1 })
    const nextNumber = latest ? Number(latest.number) + 1 : 1

    const post = await Post.create({
      user: uid,
      number: nextNumber,
      title,
      content,
      fileUrl: files,
      imageUrl,
    })

    res.status(201).json(post)
  } catch (error) {
    console.error('POST /api/posts 실패:', error)
    res.status(500).json({ message: '서버 오류가 발생했습니다.' })
  }
})

// READ: 전체
router.get('/', async (req, res) => {
  try {
    const list = await Post.find().sort({ createdAt: -1 }).lean()

    const data = list.map((p) => {
      const raw = Array.isArray(p.fileUrl) ? p.fileUrl : p.imageUrl ? [p.imageUrl] : []
      const keys = raw.filter((v) => typeof v === 'string' && v.length > 0)
      const urls = keys.map((v) => (v.startsWith('http') ? v : joinS3Url(S3_BASE_URL, v)))
      return { ...p, fileUrl: urls }
    })

    res.json(data)
  } catch (error) {
    console.error('GET /api/posts 실패', error)
    res.status(500).json({ message: '서버 오류' })
  }
})

// READ: 내 글
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id
    if (!userId) return res.status(400).json({ message: '유저 정보 없음' })

    const myPosts = await Post.find({ user: userId }).sort({ createdAt: -1 }).lean()

    const data = myPosts.map((p) => {
      const raw = Array.isArray(p.fileUrl) ? p.fileUrl : p.imageUrl ? [p.imageUrl] : []
      const keys = raw.filter((v) => typeof v === 'string' && v.length > 0)
      const urls = keys.map((v) => (v.startsWith('http') ? v : joinS3Url(S3_BASE_URL, v)))
      return { ...p, fileUrl: urls }
    })

    res.json(data)
  } catch (error) {
    console.error('GET /api/posts/my 실패', error)
    res.status(500).json({ message: '서버 오류' })
  }
})

// READ: 단건
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const doc = await Post.findById(req.params.id).lean()
    if (!doc) return res.status(404).json({ message: '존재하지 않는 게시글' })

    const keys = Array.isArray(doc.fileUrl) ? doc.fileUrl : doc.imageUrl ? [doc.imageUrl] : []
    const urls = keys
      .filter((v) => typeof v === 'string' && v.length > 0)
      .map((v) => (v.startsWith('http') ? v : joinS3Url(S3_BASE_URL, v)))

    res.json({ ...doc, fileUrl: urls })
  } catch (error) {
    res.status(500).json({ message: '서버 오류' })
  }
})

// UPDATE
router.put('/:id', authenticateToken, ensureObjectId, async (req, res) => {
  try {
    const { title, content, fileUrl, imageUrl } = req.body

    // 🆕 추가: 업데이트 이전 문서 조회(소유권 + 기존 파일 파악)
    const before = await Post.findById(req.params.id).select('user fileUrl imageUrl').lean()
    if (!before) return res.status(404).json({ message: '존재하지 않는 게시글' })

    const uid = String(req.user.id || req.user._id)
    if (String(before.user) !== uid) {
      return res.status(403).json({ message: '권한이 없습니다.' })
    }

    // 🟨 변경: undefined 필드로 기존값 덮어쓰기 방지 + 안전 변환
    const updates = pickDefined({
      title,
      content,
      fileUrl: fileUrl !== undefined ? toArray(fileUrl) : undefined,
      imageUrl,
    })

    // 🆕 추가: DB 반영 전에 삭제 대상 계산
    const oldKeys = [
      ...(Array.isArray(before.fileUrl) ? before.fileUrl : []),
      ...(before.imageUrl ? [before.imageUrl] : []),
    ]
      .map(urlToKey)
      .filter(Boolean)

    const newKeys = [
      ...(updates.fileUrl !== undefined
        ? updates.fileUrl
        : Array.isArray(before.fileUrl)
        ? before.fileUrl
        : []),
      ...(updates.imageUrl !== undefined ? [updates.imageUrl] : before.imageUrl ? [before.imageUrl] : []),
    ]
      .map(urlToKey)
      .filter(Boolean)

    // 🆕 추가: 제거된 파일만 추려서 S3에서 삭제
    const toDelete = oldKeys.filter((k) => !newKeys.includes(k))
    if (toDelete.length) {
      const results = await Promise.allSettled(toDelete.map((k) => deleteObject(k)))
      const fail = results.filter((r) => r.status === 'rejected')
      if (fail.length) {
        console.warn('[S3 Delete Partial Fail]', fail.map((f) => f.reason?.message || f.reason))
      }
    }

    // 🟨 변경: DB 업데이트 실행
    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )

    res.json(updated)
  } catch (error) {
    console.error('PUT /api/posts/:id 실패', error)
    res.status(500).json({ message: '서버 오류' })
  }
})

// DELETE (통합본)
router.delete('/:id', authenticateToken, ensureObjectId, async (req, res) => { // 🟨 변경: 중복 라우트 통합
  try {
    // 🟨 변경: 문서 전체 조회(파일 목록 포함)
    const doc = await Post.findById(req.params.id).select('user fileUrl imageUrl')
    if (!doc) return res.status(404).json({ message: '존재하지 않는 게시글' })

    const uid = String(req.user.id || req.user._id)
    if (String(doc.user) !== uid) {
      return res.status(403).json({ message: '권한이 없습니다.' })
    }

    // 🆕 추가: 게시글 관련 S3 키 모두 삭제 (절대 URL → key 변환)
    const keys = [
      ...(Array.isArray(doc.fileUrl) ? doc.fileUrl : []),
      ...(doc.imageUrl ? [doc.imageUrl] : []),
    ]
      .map(urlToKey)
      .filter(Boolean)

    if (keys.length) {
      const results = await Promise.allSettled(keys.map((k) => deleteObject(k)))
      const fail = results.filter((r) => r.status === 'rejected')
      if (fail.length) {
        console.warn('[S3 Delete Partial Fail]', fail.map((f) => f.reason?.message || f.reason))
      }
    }

    // 🟨 변경: DB 삭제
    await doc.deleteOne()

    res.json({ ok: true, id: doc._id })
  } catch (error) {
    console.error('DELETE /api/posts/:id 실패', error)
    res.status(500).json({ message: '서버 오류' })
  }
})

module.exports = router
