const Landing = () => {
  return (
    <div className="welcome-container lg-desktop:justify-between lg-desktop:ml-6 text-white flex flex-col lg-desktop:items-start lg-desktop:mt-80 mt-40">
      <div className="outer-border">
        <div className="inner-border relative">
          <div className="welcome-details flex flex-col lg-desktop:text-start justify-center text-center">
            <h1 className="lg-desktop:text-7xl text-5xl">Welcome</h1>
            <p className="pt-10 lg-desktop:pl-0 pl-3 text-lg text-start">My name is <b>Daniel Grady</b>, I am a Full Stack Engineer based in Reno, Nevada.</p>
            <p className="pt-5 lg-desktop:pl-0 pl-3 text-lg text-start">I am passionate about end-to-end, intuitive software solutions.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
export default Landing;