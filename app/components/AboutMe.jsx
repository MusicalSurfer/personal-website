const AboutMe = () => {
  return (
    <>
      <div className="relative">
        <Image priority={true} src="/profile.jpeg" alt="Picture of the author" width={500} height={300} />
        <div className="absolute bg-read-more-gradient inset-0"></div>
      </div>
    </>
  )
}
export default AboutMe;