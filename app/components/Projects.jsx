const Projects = () => {
  return (
    <div className="projects-sub-container mt-80 flex flex-row justify-between">
      <div className="project-title">
        <div data-aos="fade-in" className="border-line pb-2 border-b-2 border-white w-52">
          <h1 data-aos="fade-right" className="text-left text-6xl">Projects</h1>
        </div>
        <p data-aos="fade-in" className="quote flex flex-wrap w-96 pt-16">
          "Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful."
          <br /> - Albert Schweitzer
        </p>
      </div>
      <div data-aos="fade-left" className="project-list flex flex-col justify-center text-deep-light-blue font-sans border-y-2 border-white">
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