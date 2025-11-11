import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMe, saveAuthToStorage } from "../api/client";

const KakaoCallback = ({ onAuthed }) => {
 const navigate = useNavigate();

 useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
   navigate("/admin/login?error=kakao", { replace: true });
   return;
  }

  saveAuthToStorage({ token });

  const run = async () => {
   try {
    const me = await fetchMe();
    saveAuthToStorage({ user: me, token });
    onAuthed?.({ user: me, token });

    if (me.role === "admin") navigate("/admin/dashboard", { replace: true });
    else navigate("/user/dashboard", { replace: true });
   } catch (err) {
    console.error("Kakao callback /me error:", err);
    navigate("/admin/login?error=kakao", { replace: true });
   }
  };

  run();
 }, [navigate, onAuthed]);

 return (
  <section className="admin-wrap">
   <div className="inner">
    <p>카카오 로그인 처리 중입니다...</p>
   </div>
  </section>
 );
};

export default KakaoCallback;
