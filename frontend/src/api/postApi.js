import api from "./client";

const PUBLIC_BASE = import.meta.env.VITE_S3_PUBLIC_BASE || "";

function urlToKey(u) {
  if (!u) return "";
  const s = String(u);
  if (!/^https?:\/\//i.test(s)) return s; // 이미 key
  if (PUBLIC_BASE) {
    const base = PUBLIC_BASE.replace(/\/+$/, "");
    return s.startsWith(base + "/") ? s.slice(base.length + 1) : s;
  }
  try {
    const url = new URL(s);
    return url.pathname.replace(/^\/+/, ""); // /uploads/.. → uploads/..
  } catch {
    return s; // fallback
  }
}

function toKeyArray(val) {
  if (!val) return [];
  const arr = Array.isArray(val) ? val : [val];
  return arr.map(urlToKey).filter(Boolean);
}

export const uploadToS3 = async (file, opts = {}) => {
  const {
    data: { url, key },
  } = await api.post("/api/upload/presign", {
    filename: file.name,
    contentType: file.type,
    replaceKey,
  });

  const putRes = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!putRes.ok) throw new Error("S3 업로드 실패");

  return key;
};

export const createPost = async ({ title, content, fileKeys }) => {
  const { data } = await api.post("/api/posts", {
    title,
    content,
    fileUrl: fileKeys,
  });
  
  return data;
};


export const fetchMyPosts= async()=>{
    const {data} = await api.get('/api/posts/my')

    return Array.isArray(data)? data:[]
}
export const fetchAllPosts= async()=>{
    const {data} = await api.get('/api/posts')

    return Array.isArray(data)? data:[]
}
