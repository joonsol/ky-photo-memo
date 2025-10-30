import React from "react";
import './style/UserPostItem.scss'
const UserPostItem = ({ item }) => {
  
    const files =Array.isArray(item.fileUrl)?item.fileUrl:(item?.fileUrl? [item.fileUrl]:[])
  console.log(item)
    return (
    <div className="inner post-card">
      <div className="file-card-head">
        {(item?.number ?? "") !== "" && <span>No. {item.number}</span>}
        <h3>{item?.title ?? "제목 없음"}</h3>
      </div>
      <div className="file-card-meta">
        {item?.updateAt && (
            <time className="file-card-time">{item.updateAt}</time>
        )}
      </div>
      <div className="file-card-details">
        {item?.content && (
            <p className="file-card-content">{item.content}</p>
        )}
        {files?.length>0 && (
            <div className="file-card-image">
                {files.map((src, idx)=>(
                    <img key={idx} src={src} alt={`file-${idx}`} className="file-card-image"/>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default UserPostItem;
