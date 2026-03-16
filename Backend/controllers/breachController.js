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

    const response = await axios.get(
      `${process.env.BREACH_API}${email}`
    );

    const breaches = response.data.Breaches || [];

    const parsedBreaches = breaches.map((breach) => ({
      name: breach.Name,
      domain: breach.Domain,
      breachDate: breach.BreachDate,
      compromisedAccounts: breach.PwnCount,
      dataExposed: breach.DataClasses,
      logo: breach.LogoPath
    }));
    
    res.status(200).json({
      success: true,
      email: email,
      totalBreaches: parsedBreaches.length,
      breaches: parsedBreaches
    });

  } catch (error) {

    if (error.response?.status === 404) {
      return res.status(200).json({
        success: true,
        message: "No breach found",
        breaches: []
      });
    }

    res.status(500).json({
      success: false,
      message: `Error checking breach: ${error.message}`
    });
  }
};