import { useState, useCallback, useEffect } from "react";
import { createPost, fetchMyPosts } from "../api/postApi";

export function usePosts() {
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

  const add = useCallback(async ({ title, content, fileKeys = [] }) => {
    const created = await createPost({ title, content, fileKeys });

    setItems((prev) => [created, ...prev]);

    return created;
  }, []);

useEffect(()=>{load()},[load])

  return {
    items,
    loading,
    load,
    add,
  };
}
