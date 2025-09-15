// Layout.jsx
import { Outlet } from "react-router-dom";
import Header from "./Header.tsx";

function Layout() {
  return (
    <>  
      <Header />      
      <main>
        <Outlet />     
      </main>
    </>
  );
}

export default Layout;
