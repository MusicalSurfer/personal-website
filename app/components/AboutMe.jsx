import Image from "next/image";
const AboutMe = () => {
  return (
    <div id="aboutMe" className="mt-60 flex flex-row justify-between">
      <div className="profile-image">
        <Image priority={true} src="/profile.jpeg" alt="Picture of the author" width={500} height={300} />
      </div>
      <div className="about-text flex flex-col flex-wrap text-shale-grey">
        <h1 className="hello-text text-5xl">I'm Daniel,</h1>
        <p className="mt-5 text-lg">As a fullstack software engineer, father, and a veteran specializing in the <em>PERN</em> stack,</p>
        <p className="text-lg">I have cultivated exposure to vast supporting technologies and embrace the evolving tech landscape as a life-long learner.</p>
        <p className="text-lg">embrace the evolving tech landscape as a life-long learner.</p>
      </div>
    </div>
  )
}
export default AboutMe;