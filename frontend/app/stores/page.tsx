import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
import StoresPage from "./StoresPage";

const page = () => {
  return (
    <div className="page-wrapper">
      <div className="sidebar-container">
        <Sidebar />
      </div>
      <main className="main-content">
        <StoresPage />
      </main>
    </div>
  );
};

export default page;
