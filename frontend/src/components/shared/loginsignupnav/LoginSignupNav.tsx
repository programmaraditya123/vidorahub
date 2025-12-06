import VidorahubIcon from '@/src/icons/VidorahubIcon';
import styles from './loginsignupnav.module.scss'
import Link from 'next/link';


const LoginSignuppNav = () => {
    return(
        <div className={styles.topnav}>
            <Link href={'/'}>
            <div className={styles.topicon}>
                <div className={styles.icon}><VidorahubIcon.VidorahubIcon color='purple' height={32} width={32}/></div>
                <div className={styles.icontext}>Vidorahub</div>
            </div>
            </Link>
            
            <div className={styles.toggletheme}>
                <VidorahubIcon.MoonIcon height={32} width={32}/>
            </div>
        </div>
    )
}

export default LoginSignuppNav;