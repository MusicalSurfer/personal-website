const Projects = () => {
  return (
    <div className="projects-container mt-80 flex flex-row justify-between">
      <div data-aos="fade-right" className="project-title">
        <h1 className="text-left text-6xl">Projects</h1>
      </div>
      <div data-aos="fade-left" className="project-list flex flex-col justify-center text-deep-light-blue font-sans border-y-2 border-white">
        <ul>
          <li className="project-item pb-5 pt-5 transition duration-500 ease-in-out hover:text-light-blue hover:scale-110">
            <a href="https://github.com/Control-Alt-Defeat-MCSP2312/disney-clone">
              <p className="text-3xl">Disney Clone</p>
            </a>
          </li>
          <li className="project-item pb-5 transition duration-500 ease-in-out hover:text-light-blue hover:scale-110">
            <a href="https://github.com/Blue-Ocean-MCSPA/link-learning">
              <p className="text-3xl">Link Learning</p>
            </a>
          </li>
          <li className="project-item pb-5 transition duration-500 ease-in-out hover:text-light-blue hover:scale-110">
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