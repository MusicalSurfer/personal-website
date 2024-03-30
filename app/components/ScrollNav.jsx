import { useState, useEffect, useRef } from 'react';

const ScrollNav = () => {
  const [isActive, setIsActive] = useState(null);

  const checkScrollTop = () => {
    if (!isActive && window.scrollY > 89.25) {
      setIsActive(true);
    } else if (isActive && window.scrollY <= 89.25) {
      setIsActive(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', checkScrollTop);
    return () => window.removeEventListener('scroll', checkScrollTop);
  }, [isActive]);

  return (
    <div className={`scroll-nav-active fixed z-50 top-0 left-5 items-center flex translate-x-0 ${(isActive) ? 'opacity-100 animate-in' : (isActive !== null ? 'opacity-0 animate-out' : 'hidden')}`}>
      <a className="scroll-logo h-10 w-10 bottom-3 block relative m-0 p-0" href="/">
        <div className="logo-circle w-12 h-12 -translate-x-2 rounded-profile bg-deep-light-blue">
          <svg className="fill-black mb-3 translate-x-2px -translate-y-7px" xmlns="http://www.w3.org/2000/svg" width="42.67" height="45.1" viewBox="0 0 123 130"><path d="M41.7 61H61v-6.3H41.7q-14.4 0-24.4 10.2Q7.2 75.2 7.2 90.6q0 14.3 10.1 24.4t24.4 10.1H61V86.7H39.2v6.4h15.3v25.6H41.7q-11.4 0-19.7-8.3t-8.3-19.8q0-12.5 8.3-21.1Q30.2 61 41.7 61z" /><path d="M75 62.3h37.7v-7.6H75q-7.4 0-12.4 5.8-5.1 5.9-5.1 14.3 0 7.6 5.1 13.2 5 5.7 12.4 5.7h20.2q4.5 0 8 3.8 3.3 4 3.3 8.7 0 5.6-3.25 9.1t-8.05 3.5H57.5v6.2h37.7q7.5 0 12.5-5.2t5-13.6q0-7.6-5-13.2-5.1-5.6-12.5-5.6H75q-4.6 0-7.9-4-3.4-3.7-3.4-8.6 0-5.6 3.25-9.05T75 62.3z" /></svg>
        </div>
      </a>
      <div className="burger-menu py-6 pr-1 overflow-hidden relative inline-block cursor-pointer transition ease-out duration-500 hover:scale-110">
        <svg className="-translate-y-1" width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 18L20 18" stroke="#98c1d9" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 12L20 12" stroke="#98c1d9" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 6L20 6" stroke="#98c1d9" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}

export default ScrollNav;