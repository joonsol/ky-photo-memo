import React, { useEffect, useMemo, useState } from "react";
import { fetchAdminPosts, patchAdminPost } from "../../api/adminApi";
import AdminPostList from "../../components/admin/AdminPostsList";
import AdminFilter from "../../components/admin/AdminFilter";
const AdminPosts = () => {
  const [list, setList] = useState([]);
  const [query, setQuery] = useState({
    page: 1,
    size: 10,
    status: "",
    q: "",
    user: "",
  });

  useEffect(() => {
    (async () => {
      const items = await fetchAdminPosts(query);
      setList(items);
    })();
  }, [query]);

  return (
    <div>
      <AdminFilter/>
      <AdminPostList  items={list} />
    </div>
  );
};

export default AdminPosts;
