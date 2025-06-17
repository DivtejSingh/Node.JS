import { Request } from "../../Models/User/requestModel.js";
import { User } from "../../Models/User/userModel.js";
import { Report } from "../../Models/User/reportModel.js";
import { Experience } from "../../Models/Avatar/ExperienceModel.js";
import { Profile } from "../../Models/User/profileModel.js";
import { ReportAvt } from "../../Models/User/Avatarreport.js";
// get all
export const GetAllReport = async (req, res) => {
  try {
    // Get query parameters for pagination
    const { items_per_page = 10, pg = 1 } = req.query;
    const itemsPerPage = parseInt(items_per_page, 10);
    const page = parseInt(pg, 10);
    const skip = (page - 1) * itemsPerPage;

    // Get total number of reports
    const totalItems = await Report.countDocuments();
    // Get paginated and sorted reports with populated user and package data
    const reports = await Report.find()
      .skip(skip)
      .limit(itemsPerPage)
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .populate({
        path: 'userId',
        select: 'userName email', // Select fields to return from User
        model: 'User' // Ensure this matches your User model name
      })
      .populate({
        path: 'packageId',
        model: 'Experience',
        match: { status: 0 } // Match Experience documents with status 0
      });
   

    // Filter out reports where packageId is null
    const filteredReports = reports.filter((report) => report.packageId !== null);

    if (!filteredReports.length) {
      return res.status(404).json({
        message: "No reports found with the specified status",
        isSuccess: false
      });
    }

    return res.status(200).json({
      message: "Reports retrieved successfully",
      data: filteredReports.map(report => ({
        _id: report._id,
        userId: report.userId,
        avatarId: report.avatarId,
        packageId: report.packageId,
        SexualContent: report.SexualContent,
        VoilentContent: report.VoilentContent,
        AbusiveContent: report.AbusiveContent,
        DangerousContent: report.DangerousContent,
        SpamContent: report.SpamContent
      })),
      current_page: page,
      items_per_page: itemsPerPage,
      total_items: totalItems,
      total_page: Math.ceil(totalItems / itemsPerPage),
      isSuccess: true
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "An error occurred while fetching reports",
      error: err.message
    });
  }
};





// appoved report
export const ApproveReport = async (req, res) => {
  const { reportId } = req.params;

  try {
    // Find the report by its ID
    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: "Report not found", isSuccess: false });
    }

    // Find the related experience using packageId from the report
    const experience = await Experience.findById(report.packageId);
    if (!experience) {
      return res.status(404).json({ message: "Experience not found", isSuccess: false });
    }

    // Set the status of the experience to 1 (approved)
    experience.status = 1;
    await experience.save();

    return res.status(200).json({ message: "Report approved and experience status updated", isSuccess: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "An error occurred while approving the report", error: err.message });
  }
};

export const BlockReport = async (req, res) => {
  const { reportId } = req.params;

  try {
    // Find the report by its ID and delete it
    const report = await Report.findByIdAndDelete(reportId);

    if (!report) {
      return res.status(404).json({ message: "Report not found", isSuccess: false });
    }

    return res.status(200).json({ message: "Report successfully blocked and deleted", isSuccess: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "An error occurred while blocking the report", error: err.message });
  }
};



// report avatar data
export const GetAllReportAvt = async (req, res) => {
  try {
    // Get query parameters for pagination
    const { items_per_page = 10, pg = 1 } = req.query;
    const itemsPerPage = parseInt(items_per_page, 10);
    const page = parseInt(pg, 10);
    const skip = (page - 1) * itemsPerPage;

    // Get total number of reports
    const totalItems = await ReportAvt.countDocuments();

    // Get paginated and sorted reports with populated user and avatar data
    const reports = await ReportAvt.find()
      .skip(skip)
      .limit(itemsPerPage)
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .populate({
        path: 'userId',
        select: 'userName email profileImage', // Ensure the field name matches your schema
        model: 'User'
      })
      .populate({
        path: 'avatarID',
        select: 'userName email profileImage', // Ensure the field name matches your schema
        model: 'User'
      });

    if (!reports.length) {
      return res.status(404).json({
        message: "No reports found",
        isSuccess: false
      });
    }

    return res.status(200).json({
      message: "Reports retrieved successfully",
      data: reports.map(report => ({
        _id: report._id,
        avatarID: report.avatarID ? {
          _id: report.avatarID._id,
          userName: report.avatarID.userName,
          profileImage: report.avatarID.profileImage,
          email: report.avatarID.email
        } : null,
        user: report.userId ? {
          _id: report.userId._id,
          userName: report.userId.userName,
          profileImage: report.userId.profileImage,
          email: report.userId.email
        } : null,
        Scamming: report.Scamming,
        Offensive: report.Offensive,
        SomethingElse: report.SomethingElse
      })),
      current_page: page,
      items_per_page: itemsPerPage,
      total_items: totalItems,
      total_page: Math.ceil(totalItems / itemsPerPage),
      isSuccess: true
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "An error occurred while fetching reports",
      error: err.message
    });
  }
};

