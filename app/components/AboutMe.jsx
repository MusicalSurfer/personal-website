import Image from "next/image";
const AboutMe = () => {
  return (
    <div className="mt-60 flex flex-row justify-between">
      <div className="profile-image">
        <Image className="rounded-profile shadow-2xl mr-20" priority={true} src="/5702.png" alt="Picture of the author" width={550} height={550} />
      </div>
      <div className="about-text font-sans items-start w-588px mr-40 h-full flex flex-col flex-wrap text-shale-grey">
        <h1 className="hello-text text-6xl">I'm Daniel,</h1>
        <p className="mt-5 text-xl">As a dedicated full-stack software engineer, I specialize in end-to-end solutions utilizing the PERN stack (PostgreSQL, Express.js, React, Node.js).</p>
        <p className="line-space mt-2"></p>
        <p className="text-xl">As a veteran, husband, and proud father, I embrace the values of family, diligence and dedication.</p>
      </div>
    </div>
  )
}
export default AboutMe;