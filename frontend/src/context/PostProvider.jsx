import React, { useState, useEffect, useCallback } from "react";
import {
  createPost,
  fetchMyPosts,
  updatedPost,
  deletePost,
} from "../api/postApi";
import { PostContext } from "./PostContext";

export const PostProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const list = await fetchMyPosts();
      setItems(list);
    } catch (error) {
      setLoading(false);
    }
  });

  const remove = useCallback(async (id) => {
    await deletePost(id);
    setItems((prev) => prev.filter((i) => i._id !== id));
  }, []);

  const update = useCallback(async (id) => {
    const updated = await updatedPost(id, patch);
    setItems((prev) => prev.map((i) => (i.id == id ? undefined : i)));

    return updated
  }, []);

  const add = useCallback(async ({ title, content, fileKeys = [] }) => {
    const created = await createPost({ title, content, fileKeys });

    setItems((prev) => [created, ...prev]);

    return created;
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PostContext.Provider value={{items, loading, load, add, remove, update}}>
        {children}
    </PostContext.Provider>
  )
};

export default PostProvider;
