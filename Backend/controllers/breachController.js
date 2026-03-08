import axios from "axios";

export const checkBreach = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }
    // External Breach API call
    const response = await axios.get(
      `${process.env.BREACH_API}${email}`
    );
    console.log(response.data)
    res.status(200).json(response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(200).json({
        success: true,
        message: "No breach found"
      });
    }
    res.status(500).json({ 
      message:` Error checking breach : ${error.message} `
    });
  }
};