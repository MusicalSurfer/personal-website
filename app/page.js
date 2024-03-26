import Landing from "./components/Landing.jsx";
import Header from "./components/Header.jsx";

export default function Home() {
  return (
    <div className="main-container flex min-h-screen flex-col justify-start items-center bg-custom-gradient pb-24 font-sans antialiased">
      <div className="px-300px h-full w-full bg-shale-grey">
        <Header />
      </div>
      <div className="main-sub-container w-full h-full relative px-300px">
        <Landing />
      </div>
    </div>
  );
}
