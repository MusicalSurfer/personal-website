import Image from 'next/image'

const Landing = () => {
  return (
    <div className="flex justify-between items-center">
      <div className="ml-6 text-light-blue flex flex-col items-start">
        <h1 className="text-left mt-20 text-6xl">Welcome</h1>
        <p className="pt-10 text-lg">My name is Daniel Grady, I am a Full Stack Engineer Engineer based in Reno, Nevada.</p>
        <p className="pt-5 text-lg">I am passionate about complete, jaw dropping software solutions.</p>
      </div>
      <div className="opacity-70">
        <Image src="/profile.jpeg" alt="Picture of the author" width={500} height={300} />
      </div>
    </div>
  )
}
export default Landing;