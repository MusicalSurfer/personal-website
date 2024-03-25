import Landing from "./components/Landing.jsx";
import Header from "./components/Header.jsx";

export default function Home() {
  return (
    <div className="main-container flex min-h-screen flex-col justify-start items-center bg-custom-gradient py-24 px-300px font-sans antialiased">
      <div className="main-sub-container w-full h-full rounded-sm after:w-90px after:h-90px">
        <Header />
        <Landing />
      </div>
    </div>
  );
}
