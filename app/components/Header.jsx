import AppContext from '../context/Index.jsx';

const Header = () => {
  const { changeIsActive } = useContext(AppContext);
  const handleClick = () => {
    changeIsActive(true);
  }

  return (
    <nav className="header-details flex items-center justify-between flex-wrap p-6 w-full">
      <div className="flex items-center flex-shrink-0 text-white mr-6">
        <svg className="fill-current mb-3 mr-1" xmlns="http://www.w3.org/2000/svg" width="27.675" height="29.25" viewBox="0 0 123 130"><path d="M41.7 61H61v-6.3H41.7q-14.4 0-24.4 10.2Q7.2 75.2 7.2 90.6q0 14.3 10.1 24.4t24.4 10.1H61V86.7H39.2v6.4h15.3v25.6H41.7q-11.4 0-19.7-8.3t-8.3-19.8q0-12.5 8.3-21.1Q30.2 61 41.7 61z" /><path d="M75 62.3h37.7v-7.6H75q-7.4 0-12.4 5.8-5.1 5.9-5.1 14.3 0 7.6 5.1 13.2 5 5.7 12.4 5.7h20.2q4.5 0 8 3.8 3.3 4 3.3 8.7 0 5.6-3.25 9.1t-8.05 3.5H57.5v6.2h37.7q7.5 0 12.5-5.2t5-13.6q0-7.6-5-13.2-5.1-5.6-12.5-5.6H75q-4.6 0-7.9-4-3.4-3.7-3.4-8.6 0-5.6 3.25-9.05T75 62.3z" /></svg>
        <a href="#">
          <span className="font-semibold text-xl tracking-tight">Grady Software Solutions</span>
        </a>
      </div>
      <div className="block lg:hidden">
        <button onClick={handleClick} className="flex items-center px-3 py-2 border rounded text-deep-light-blue border-deep-light-blue hover:text-white hover:border-white">
          <svg className="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Menu</title><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" /></svg>
        </button>
      </div>
      <div className="w-full hidden flex-grow tablet:flex tablet:visible lg:items-center lg:w-auto">
        <div className="text-sm lg:flex-grow">
          <a href="#projects" className="block mt-4 lg:inline-block text-base lg:mt-0 text-deep-light-blue hover:text-white mr-4">
            Projects
          </a>
          <a href="#responsive-header" className="block mt-4 lg:inline-block text-base lg:mt-0 text-deep-light-blue hover:text-white mr-4">
            Blog
          </a>
          <a href="#aboutMe" className="block mt-4 lg:inline-block text-base lg:mt-0 text-deep-light-blue hover:text-white">
            About Me
          </a>
        </div>
        <div className="antialiased">
          <a href="https://www.linkedin.com/in/daniel-grady/">
            <svg style={{ fill: "white", verticalAlign: "middle", marginRight: "20px", display: "inline-block" }} width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
          </a>
          <a href="https://www.instagram.com/musicalsurfer/?hl=en">
            <svg style={{ fill: "white", verticalAlign: "middle", marginRight: "20px", display: "inline-block" }} width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
          </a>
          <a href="https://github.com/MusicalSurfer">
            <svg style={{ verticalAlign: "middle", marginRight: "10px", display: "inline-block" }} width="33" height="32" viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="#fff" /></svg>
          </a>
          <a href="https://twitter.com/daniel_j_grady">
            <svg style={{ fill: "white", verticalAlign: "middle", marginRight: "20px", display: "inline-block" }} width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M26.37,26l-8.795-12.822l0.015,0.012L25.52,4h-2.65l-6.46,7.48L11.28,4H4.33l8.211,11.971L12.54,15.97L3.88,26h2.65 l7.182-8.322L19.42,26H26.37z M10.23,6l12.34,18h-2.1L8.12,6H10.23z" /></svg>
          </a>
          <a href="mailto:gradysoftwaresolutions@gmail.com" className="text-sm px-4 py-2 leading-none border rounded text-light-blue border-light-blue hover:border-transparent hover:text-deep-blue hover:bg-white mt-4 lg:mt-0">Contact Me</a>
        </div>
      </div>
    </nav>
  )
}
export default Header;