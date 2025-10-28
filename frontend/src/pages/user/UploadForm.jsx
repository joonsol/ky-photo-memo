import React, { useState, useRef } from 'react'
import "./style/UploadForm.scss"
const UploadForm = ({
 onUploaded,      
  initail,
  onClose
}) => {

  const [form, setForm] = useState({
    title: initail?.title ?? "",
    content: initail?.content ?? "",
    file: null,
    preview: null
  })

  const [uploading, setUploading] = useState(false)
  const panelRef = useRef(null)


  const handleFileChange = (e) => {

    const file = e.target.files?.[0]

    if (!file) return

    if (form.preview) URL.revokeObjectURL(form.preview)
    const previewUrl = URL.createObjectURL(file)

    setForm((prev) => ({ ...prev, file, preview: previewUrl }))


  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[SUBMIT] start", { form, uploading, hasOnUploaded: !!onUploaded }); // ★ 항상 제일 먼저

    if (!form.title.trim()) {
      console.warn("[SUBMIT] title empty");
      alert("제목을 입력하세요.");
      return;
    }
    if (uploading) return;

    try {
      setUploading(true);

      console.log("[SUBMIT] call onUploaded");
      await onUploaded?.({
        title: form.title.trim(),
        content: form.content.trim(),
        file: form.file,
      });
      console.log("[SUBMIT] onUploaded done");

      if (form.preview) URL.revokeObjectURL(form.preview);
      setForm({ title: "", content: "", file: null, preview: null });

      // onClose는 동기 콜백일 가능성이 높음 → await 제거
      onClose?.();
      console.log("[SUBMIT] close modal");
    } catch (err) {
      console.error("[SUBMIT] error", err);
      alert(err?.message || "업로드 실패");
    } finally {
      setUploading(false);
    }
  };
  return (
    <section className='am-backdrop'>
      <form
        ref={panelRef}
        onSubmit={handleSubmit}
        className='am-panel Upload-form'>
        <header>
          <h2>파일 업로드</h2>
          <p className="sub">이미지와 간단한 메모를 함께 업로드 하세요</p>
        </header>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="title">제목</label>
            <input
              id='title'
              type="text"
              name='title'
              value={form.title}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }}
              placeholder='제목을 입력하세요' />
          </div>
          <div className="field">
            <label htmlFor="content">내용</label>
            <textarea
              id='content'
              name='content'
              value={form.content}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, content: e.target.value }))
              }}
              placeholder='간단한 설명을 적어주세요'
              rows={3}
            />
          </div>
          <div className="field">
            <div className="file-row">
              <input
                accept='image/*'
                type="file"
                name='file'
                onChange={handleFileChange}
              />
              {form.preview && (
                <div className='preview-wrap'>
                  <img src={form.preview} alt="미리보기" className='preview-thumb' />
                  <p className="file-name">{form.file?.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={onClose}>취소</button>
          <button
            type='submit'
            disabled={uploading}
            className="btn primary">
            {uploading ? "업로드 중..." : "업로드"}
          </button>
        </div>
      </form>
    </section>
  )
}

export default UploadForm