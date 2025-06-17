
import { Admin } from "../../Models/Admin/AdminModel.js";









export const searchCommissions = async (req, res) => {
    try {
        const { query } = req.query;
  
        // Ensure the query parameter is provided
        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Please provide a search query.",
            });
        }
  
        // Search for commissions that match the query in the email field
        const commissions = await Admin.find({
            email: { $regex: query, $options: "i" } 
        }).select("_id email commission createdAt"); 
  
        // Return the search results
        return res.status(200).json({
            success: true,
            message: "Commissions fetched successfully.",
            data: commissions,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
  };