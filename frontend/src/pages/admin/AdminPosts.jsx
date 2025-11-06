import React ,{useEffect,useState}from 'react'
import {fetchAdminPosts, patchAdminPost} from '../../api/adminApi'
import AdminFilter from '../../components/admin/AdminFilter'
import AdminPostsList from '../../components/admin/AdminPostsList'
const AdminPosts = () => {
  const [list, setList]=useState([])

  const [query, setQuery]=useState({
    page:1,
    size:10,
    status:'',
    q:'',
    user:''
  })


  useEffect(()=>{
    (async()=>{
      try {
        const items=await fetchAdminPosts(query)
        setList(items)
      } catch (error) {
        console.error('게시글 불러오기 실패', error)
      }
    })
  },[query])
  return (
    <div>
      <AdminFilter/>
      <AdminPostsList items={list}/>
    </div>
  )
}

export default AdminPosts