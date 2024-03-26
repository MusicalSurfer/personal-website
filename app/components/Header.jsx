const Header = () => {
  return (
    <nav className="flex items-center justify-between flex-wrap p-6 w-full">
      <div className="flex items-center flex-shrink-0 text-white mr-6">
        <svg className="fill-current mb-3 mr-1" xmlns="http://www.w3.org/2000/svg" width="27.675" height="29.25" viewBox="0 0 123 130"><path d="M41.7 61H61v-6.3H41.7q-14.4 0-24.4 10.2Q7.2 75.2 7.2 90.6q0 14.3 10.1 24.4t24.4 10.1H61V86.7H39.2v6.4h15.3v25.6H41.7q-11.4 0-19.7-8.3t-8.3-19.8q0-12.5 8.3-21.1Q30.2 61 41.7 61z" /><path d="M75 62.3h37.7v-7.6H75q-7.4 0-12.4 5.8-5.1 5.9-5.1 14.3 0 7.6 5.1 13.2 5 5.7 12.4 5.7h20.2q4.5 0 8 3.8 3.3 4 3.3 8.7 0 5.6-3.25 9.1t-8.05 3.5H57.5v6.2h37.7q7.5 0 12.5-5.2t5-13.6q0-7.6-5-13.2-5.1-5.6-12.5-5.6H75q-4.6 0-7.9-4-3.4-3.7-3.4-8.6 0-5.6 3.25-9.05T75 62.3z" /></svg>
        <a href="/">
          <span className="font-semibold text-xl tracking-tight">Grady Software Solutions</span>
        </a>
      </div>
      <div className="block lg:hidden">
        <button className="flex items-center px-3 py-2 border rounded text-deep-light-blue border-deep-light-blue hover:text-white hover:border-white">
          <svg className="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Menu</title><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" /></svg>
        </button>
      </div>
      <div className="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
        <div className="text-sm lg:flex-grow">
          <a href="#responsive-header" className="block mt-4 lg:inline-block text-base lg:mt-0 text-deep-light-blue hover:text-white mr-4">
            Projects
          </a>
          <a href="#responsive-header" className="block mt-4 lg:inline-block text-base lg:mt-0 text-deep-light-blue hover:text-white mr-4">
            Blog
          </a>
          <a href="#responsive-header" className="block mt-4 lg:inline-block text-base lg:mt-0 text-deep-light-blue hover:text-white">
            About Me
          </a>
        </div>
        <div className="antialiased">
          <a href="https://www.linkedin.com/in/daniel-grady/">
            <svg style={{ fill: "white", verticalAlign: "middle", marginRight: "20px", display: "inline-block" }} width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
          </a>
          <a href="https://github.com/MusicalSurfer">
            <svg style={{ verticalAlign: "middle", marginRight: "20px", display: "inline-block" }} width="33" height="32" viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="#fff" /></svg>
          </a>
          <a href="mailto:gradysoftwaresolutions@gmail.com" className="text-sm px-4 py-2 leading-none border rounded text-light-blue border-light-blue hover:border-transparent hover:text-deep-blue hover:bg-white mt-4 lg:mt-0">Contact Me</a>
        </div>
      </div>
    </nav>
  )
}
export default Header;