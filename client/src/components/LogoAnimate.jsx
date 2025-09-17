import blue from "../assets/blue.png"
import yellow from "../assets/yellow.png"
import "../styles/LogoAnimate.css"

export default function LogoAnimate(){

    return (
        <>
        <section className="rouetitle">
          <div className="divroue">
            <img src={blue} className="roue blue" />                  
            <img src={yellow} className="roue yellow" />
            </div>
             <h1 className="ai-secretary">
            <span className="ai">AI</span> <span className="secretary">Secretary</span>
          </h1>

        </section>
        </>
    )
}