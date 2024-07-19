import axios from "axios";

const BASE_URL = "http://gandi-main-qa.xiguacity.cn/"; // localhost debug

const obtainToken = (creationId: string, authority: string) => {
  return axios.post(
    BASE_URL + "rtc/join",
    {
      creationId: creationId,
      authority: authority,
    },
    {
      withCredentials: true,
    },
  );
};

export default obtainToken;
