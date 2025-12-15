'use client'

import { useEffect, useRef, useState } from 'react'
import VidorahubIcon from '@/src/icons/VidorahubIcon'
import styles from './homenavbar.module.scss'

const HomeNavbar = () => {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={styles.topnav}>
      
      {/* Search */}
      <div className={styles.searchWrapper}>
        <VidorahubIcon.SearchIcon width={18} height={18} />
        <input placeholder="Search videos, creators..." />
        <VidorahubIcon.FilterIcon width={18} height={18} />
      </div>

      {/* Right Section */}
      <div className={styles.navright}>
        <button className={styles.iconBtn}>
          <VidorahubIcon.BellAlertIcon width={22} height={22} />
        </button>

        {/* Profile */}
        <div className={styles.profileWrapper} ref={dropdownRef}>
          <div
            className={styles.profile}
            onClick={() => setOpen((prev) => !prev)}
          >
            <VidorahubIcon.UserIcon width={22} height={22} />
          </div>

          {open && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <p className={styles.username}>Aditya</p>
                <span className={styles.email}>aditya@email.com</span>
              </div>

              <button className={styles.dropdownItem}>
                <VidorahubIcon.UserIcon width={18} height={18} />
                Profile
              </button>

              <button className={styles.dropdownItem}>
                <VidorahubIcon.SettingsIcon width={18} height={18} />
                Settings
              </button>

              <div className={styles.divider} />

              <button className={`${styles.dropdownItem} ${styles.logout}`}>
                <VidorahubIcon.LogoutIcon width={18} height={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomeNavbar










// import VidorahubIcon from '@/src/icons/VidorahubIcon';
// import styles from './homenavbar.module.scss'

// const HomeNavbar = () => {
//     return(
//         <div className={styles.topnav}>
//             <div className={styles.navsearch}>
//                 <input type='text' placeholder='Search ...'/>
//             </div>
//             <div className={styles.navright}>
//                 <div className={styles.notification}>
//                     <VidorahubIcon.BellAlertIcon height={28} width={28}/>

//             </div>
//             <div className={styles.profile}>
//                 <VidorahubIcon.UserIcon height={28} width={28}/>

//             </div>

//             </div>
            
//         </div>
//     )
// }

// export default HomeNavbar;