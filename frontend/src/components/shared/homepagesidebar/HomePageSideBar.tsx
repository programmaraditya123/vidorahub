import VidorahubIcon from '@/src/icons/VidorahubIcon';
import styles from './homepagesidebar.module.scss'
import Link from 'next/link';


const HomePageSideBar = () => {
    return(
        <div className={styles.toplogo}>
        <h1 className={styles.logotext}>Vidorahub</h1>
        <ul>
            <li className={styles.homesideitems}><VidorahubIcon.HomeIcon color='white' height={24} width={24}/>Home</li>
            <li className={styles.homesideitems}><VidorahubIcon.FollowingIcon color='white'height={24} width={24}/> Following</li>
            <Link href={'/uploadvideo'}><li className={styles.homesideitems}><VidorahubIcon.UploadIcon color='white' height={24} width={24}/>Upload</li></Link>
            <li className={styles.homesideitems}><VidorahubIcon.FileIcon color='white' height={24} width={24}/>Library</li>
            <li className={styles.homesideitems}><VidorahubIcon.ProfileCircleIcon color='white' height={24} width={24}/>Profile</li>
            <li className={styles.homesideitems}><VidorahubIcon.SettingsIcon color='white' height={24} width={24}/>Settings</li>
        </ul>
        <div className={styles.toggle}>
            <ul>
            {/* <li className={styles.toggleitem}><VidorahubIcon.SunIcon color='white' height={24} width={24}/>Theme</li> */}
            <li className={styles.toggleitem}><VidorahubIcon.MoonIcon color='white' height={24} width={24}/>Theme</li>

            </ul>

        </div>
        </div>
    )
}

export default HomePageSideBar;