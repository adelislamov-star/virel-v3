'use client'

import { useState, useEffect } from 'react'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('virel-cookie-consent')) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const accept = (level: 'all' | 'essential') => {
    localStorage.setItem('virel-cookie-consent', level)
    setVisible(false)
  }

  return (
    <>
      <style>{`
        .cookie-banner {
          position:fixed; bottom:0; left:0; right:0; z-index:9999;
          background:rgba(10,10,10,0.97); border-top:1px solid rgba(255,255,255,0.08);
          padding:20px 40px; display:flex; align-items:center; justify-content:space-between;
          gap:24px; font-family:'DM Sans',sans-serif;
          animation:cookieSlideUp .4s ease;
        }
        @keyframes cookieSlideUp { from{transform:translateY(100%)} to{transform:none} }
        .cookie-text { font-size:13px; color:#808080; line-height:1.6; max-width:680px; }
        .cookie-text a { color:#C5A572; text-decoration:underline; }
        .cookie-btns { display:flex; gap:10px; flex-shrink:0; }
        .cookie-btn { padding:10px 20px; font-size:11px; letter-spacing:.1em; text-transform:uppercase; cursor:pointer; border:none; font-family:inherit; transition:all .2s; }
        .cookie-btn-accept { background:#C5A572; color:#0A0A0A; }
        .cookie-btn-accept:hover { background:#d4b87a; }
        .cookie-btn-essential { background:transparent; border:1px solid #333; color:#808080; }
        .cookie-btn-essential:hover { border-color:#C5A572; color:#C5A572; }
        @media(max-width:640px){
          .cookie-banner { flex-direction:column; padding:20px 24px; gap:16px; }
          .cookie-btns { width:100%; }
          .cookie-btn { flex:1; }
        }
      `}</style>
      <div className="cookie-banner">
        <p className="cookie-text">
          We use cookies to improve your experience. By continuing to browse, you agree to our{' '}
          <a href="/privacy">privacy policy</a>.
        </p>
        <div className="cookie-btns">
          <button className="cookie-btn cookie-btn-accept" onClick={() => accept('all')}>Accept All</button>
          <button className="cookie-btn cookie-btn-essential" onClick={() => accept('essential')}>Essential Only</button>
        </div>
      </div>
    </>
  )
}
