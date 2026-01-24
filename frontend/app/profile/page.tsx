import Header from "@/src/components/ProfilePage/Header";
import styles from "./Profile.module.scss";
import ProfileCard from "@/src/components/ProfilePage/ProfileCard";
import Tabs from "@/src/components/ProfilePage/Tabs";
import MasonryGrid from "@/src/components/ProfilePage/MasonryGrid";
import Sidebar from "@/src/components/ProfilePage/Sidebar";
import Footer from "@/src/components/ProfilePage/Footer";


export default function ProfilePage() {
  return (
 <div className={styles.page}>
      {/* BACKDROP */}
      <div className={styles.backdrop}>
        <div className={styles.backdropOverlay}></div>
        <div
          className={styles.backdropImage}
          // style={{
          //   backgroundImage:
          //     "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBwtGiU9Ms5TlHf9ZXM-7Gn_iK15HnLqMQFxiirlwduJI5L5uvAaclB5sFrm83Oqx4kg1T2dCJ7TK5QIVthEdMUby0RkXnZ6DHpiDpkdsEJnAxruDwvNV9_8arNVHEst2z2cecX1bez_MTGbHIdD15-wivZ4ihO00JIJoezzaaSF2mmbzESotNs5Ehh5Y2pk61NhCBcNUPNk0CD76KEL-7gsK52y5UjQMT-fceFR8p92cNxPFaJuOUg8JVIl9wNXvzzcCqMl1WInc0F')",
          // }}
        />
      </div>

      <div className={styles.container}>
        <Header />

        <main className={styles.main}>
          <section className={styles.content}>
            <ProfileCard />
            <Tabs />
            <MasonryGrid />
          </section>

          <Sidebar />
        </main>

        <Footer />
      </div>
    </div>
  );
}





// 'use client'

// import ProfileHeader from "@/src/components/Profile/ProfileHeader/ProfileHeader"
// import ProfileNavbar from "@/src/components/shared/profilenavbar/ProfileNavbar"
// import styles from '../page.module.css'
// import ProfileStats from "@/src/components/Profile/profilestats/ProfileStats"
// import ProfileContent from "@/src/components/Profile/profilecontent/ProfileContent"


// const Page = () => {
//   return (
//     <div className={styles.profilecont}>
//         <ProfileNavbar/>
//         <div className={styles.childcont}>
//         <ProfileHeader
//             name="Alex Thompson"
//             username="alexthompson"
//             bio="Creating content about tech, design, and everything in between. Join me on this journey!"
//             onEditProfile={() => console.log('Edit profile')}
//             onAccountSettings={() => console.log('Account settings')}
//             />
//             <ProfileStats
//                 stats={[
//                     { label: 'Videos', value: 128 },
//                     { label: 'Subscribers', value: '1.2M' },
//                     { label: 'Following', value: 450 },
//                 ]}
//                 />
//                 <ProfileContent/>

//             </div>

//     </div>
//   )
// }

// export default Page