import React from 'react'
import {formatYMD} from '../../util/formatYMD'
const AdminPostsList = ({items=[]}) => {
  return (
    <div className='inner'>
      <header>
        <span>제목</span>
        <span>작성자</span>
        <span>상태</span>
        <span>업데이트</span>
        <span>액션</span>
      </header>
      <ul className="admin-list-body">
        <li>
          <span className="title">타이틀</span>
          <span className="user">user name</span>
          <span className="status">pending</span>
          <span className="date">
          2025-11-06
          </span>
          <span className="actions">
            <button className="btn secondary">
              승인
            </button>
            
            <button className="btn danger">
              거절
            </button>

          </span>
        </li>
      </ul>
    </div>
  )
}

export default AdminPostsList