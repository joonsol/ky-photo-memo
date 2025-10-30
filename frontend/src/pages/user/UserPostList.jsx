import React from "react";
import UserPostItem from "./UserPostItem";
import './style/UserPostList.scss'
const UserPostList = ({ items = [], loading, onReload, search }) => {

if(!items.length) return <p>게시물이 없습니다.</p>


  return (
  <div className="post-list">
    {items.map((i)=>(
        <UserPostItem
        key={i._id}
        item={i}
        />
    ))}
  </div>
  );
};

export default UserPostList;
