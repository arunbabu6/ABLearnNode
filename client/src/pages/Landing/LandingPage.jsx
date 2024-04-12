import Navbar from "../../components/navbar/Navbar";
import Card from "../../components/Card/Card";
import { useEffect, useState } from "react";
import axios from "axios";
import RequestModel from "../../components/RequestModal/RequestModel";
import { useAuth0 } from "@auth0/auth0-react"

function LandingPage() {
  const user = useAuth0();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [granterData, setGratnerData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState(granterData);

  const handleSearch = (e) => {
    const searchVar = e.target.value;
    setSearchTerm(searchVar);
    const filterCards = granterData.filter((cards) => {
      const grantName = cards.name;
      return grantName.toLowerCase().includes(searchVar.toLowerCase());
    });
    setFilteredData(filterCards);
  };

  const handleRequestClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL}api/getGrants`;
      try {
        const response = await axios.get(API_BASE_URL);
        setGratnerData(response.data);
        setFilteredData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const OnBoardUser = async () => {
      console.log(user.user.nickname)
      try {
        const userData = {
          role: 'Client',
          username: user.user.nickname,
          email: user.user.email,
          picture: user.user.picture,
        };
        const api_url = `${process.env.REACT_APP_API_BASE_URL}api/save-new-user`;
        const response = await axios.post(api_url, userData);
        console.log("Response from server: --------", response.data);
      } catch (error) {
        console.error("Error making Axios POST request:", error);
      }
    };

    fetchData();
    OnBoardUser();
  }, []);

  return (
    <div className="grid h-screen w-full grid-cols-1 bg-neutral-50">
      <div className="h-16 bg-neutral-50">
        <Navbar />
      </div>
      <div className="flex justify-center w-full items-center mt-8 h-14">
        <div className="flex w-[75%] h-16">
          <div className=" flex rounded-lg w-full">
            <ul className="flex items-center justify-between w-full">
              <div className="w-[60%]">
                <li>
                  <input
                    className="border rounded-2xl p-2 px-4 w-[40%] focus:border-green-700 outline:none"
                    placeholder="search for grants..."
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </li>
              </div>
              <div className="">
                <li
                  onClick={handleRequestClick}
                  className="px-4 py-2 rounded-2xl cursor-pointer hover:text-white hover:bg-green-600 text-green-500 "
                >
                  Requests
                </li>
              </div>
            </ul>
          </div>
          <RequestModel isOpen={isModalOpen} onClose={handleCloseModal} />
        </div>
      </div>
      <div className="row-span-2 grid w-full place-items-center gap-6 bg-neutral-50 p-4 md:row-span-8 md:grid-cols-4 md:px-36">
        {filteredData.map((granter) => (
          <>
            <Card
              key={granter._id}
              img={granter.grantImage}
              name={granter.name}
              desc={granter.description}
              rate={granter.grant_amount}
            />
          </>
        ))}
      </div>
      <div className="grid h-20 grid-cols-3 place-items-center rounded-xl bg-neutral-100">
        <div className="copyright">© 2024 Nausicca. All rights reserved.</div>
        <div className="contact">
          Contact us: info@nausicca.com | 000-000-0000
        </div>
        <div className="links">
          <a href="#">About Us</a> | <a href="#">Services</a> |{" "}
          <a href="#">Contact</a>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
