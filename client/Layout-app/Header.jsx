import login from "../src/assets/avatar.png"
import logout from "../src/assets/enter.png"
import logo from "../src/assets/logo.png"
import "../Layout-app/style/Header.css"

export default function Header(){



    return (

        <header>
            <img src={logo} alt="logo-site" className="logo-site" />
            
            <section className="section-logo">
            <img src={login} alt="logo-login" className="logo-login"/>
            <img src={logout} alt="logo-logout" className="logo-logout" />
            </section>
        </header>


    )
}