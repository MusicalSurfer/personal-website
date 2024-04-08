const Projects = () => {
  return (
    <div className="projects-sub-container lg-desktop:mt-80 flex lg-desktop:flex-row flex-col justify-center text-white">
      <div className="project-title flex flex-col justify-center text-center">
        <div data-aos="fade-in" className="border-line pb-2 border-b-2 border-white lg-desktop:w-52 lg-desktop:pt-0 pt-10">
          <h1 data-aos="fade-right" className="text-6xl text-center">Projects</h1>
        </div>
        <p data-aos="fade-in" className="quote flex flex-wrap lg-desktop:w-96 w-full lg-desktop:pt-16 pt-12 lg-desktop:pb-0 pb-16">
          "Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful."
          <br /> - Albert Schweitzer
        </p>
      </div>
      <div data-aos="fade-left" className="project-list overflow-hidden flex flex-col justify-center text-deep-light-blue font-sans border-y-2 border-white">
        <ul data-aos="fade-left">
          <li className="project-item pb-5 pt-5 transition duration-500 ease-in-out hover:text-white hover:scale-110">
            <a href="https://github.com/Control-Alt-Defeat-MCSP2312/disney-clone">
              <p className="text-3xl">Disney Clone</p>
            </a>
          </li>
          <li className="project-item pb-5 transition duration-500 ease-in-out hover:text-white hover:scale-110">
            <a href="https://github.com/Blue-Ocean-MCSPA/link-learning">
              <p className="text-3xl">Link Learning</p>
            </a>
          </li>
          <li className="project-item pb-5 transition duration-500 ease-in-out hover:text-white hover:scale-110">
            <a href="https://github.com/MusicalSurfer/personal-website">
              <p className="text-3xl">Grady Software Solutions</p>
            </a>
          </li>
        </ul>
      </div>
    </div>

  )
}
export default Projects;