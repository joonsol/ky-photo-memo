import React, { useState } from 'react'
import FileList from './FileList'
import UploadForm from './UploadForm'
import "./style/UserDashboard.scss"
import { uploadToS3 } from '../../api/postApi'
import { usePosts } from '../../hooks/usePosts'
const UserDashboard = () => {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)

  const { items, loading, load, add } = usePosts()

const handleUploaded = async ({ title, content, file }) => {
  try {
    console.log("[UPLOAD] step1 start", { title, content, hasFile: !!file });
    const key = file ? await uploadToS3(file) : null;
    console.log("[UPLOAD] step2 s3 ok", key);

    const created = await add({ title, content, fileKeys: key ? [key] : [] });
    console.log("[UPLOAD] step3 db ok", created);
  } catch (e) {
    console.error("[UPLOAD] failed", e);
  }
};

  return (
    <section>
      <div className="inner">
        <div className="search-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='검색어를 입력해주세요' />
          <button
            className='btn primary'
            onClick={() => setOpen(true)}
          >업로드
          </button>
        </div>
      </div>
      <div className="inner">
        {open && (
          <UploadForm
            onUploaded={handleUploaded} 
            open={open}
            onClose={() => setOpen(false)}
          />
        )}
        <FileList />
      </div>
    </section>
  )
}

export default UserDashboard