import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Bar from "../components/Bar";


const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
    
      <Bar />
      {/* <div className="flex-grow bg-gray-100"> */}
        {/* <div className="container mx-auto px-4 py-8"> */}
          {/* <Outlet /> */}
        {/* </div> */}
      {/* </div> */}
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
