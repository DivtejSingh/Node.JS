import { Device } from "../../Models/Admin/AddDevicesModel.js";




export const addDevices = async (req, res) => {
    try {
      const { deviceType, model } = req.body;

      const existingDevice = await Device.findOne({ deviceType, model });
  
      if (existingDevice) {
        return res.status(400).json({
          success: false,
          message: "Device with the same type and model already exists",
        });
      }
  
      // Create a new device if it doesn't already exist
      const newDevice = new Device({ deviceType, model });
  
      const savedDevice = await newDevice.save();
      res.status(201).json({
        success: true,
        message: "Device added successfully",
        data: savedDevice,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to add device",
        error: error.message,
      });
    }
  };
  



export const GetAllDevices = async (req, res) => {
  try {
    const { items_per_page = 10, pg = 1 } = req.query;

    const itemsPerPage = parseInt(items_per_page, 10);
    const page = parseInt(pg, 10);

    const skip = (page - 1) * itemsPerPage;

    const totalItems = await Device.countDocuments();

    const devices = await Device.find()
      .skip(skip)
      .limit(itemsPerPage);

    const totalPage = Math.ceil(totalItems / itemsPerPage);

    res.status(200).json({
      success: true,
      message: "Devices retrieved successfully",
      data: devices,
      current_page: page,
      items_per_page: itemsPerPage,
      total_items: totalItems,
      total_page: totalPage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve devices",
      error: error.message,
    });
  }
};




 
  

export const updateDevices = async (req, res) => {
    try {
      const { deviceType, model } = req.body;
  
      // Check if another device with the same deviceType and model already exists
      const existingDevice = await Device.findOne({
        deviceType,
        model,
        _id: { $ne: req.params.id }, // Exclude the device being updated
      });
  
      if (existingDevice) {
        return res.status(400).json({
          success: false,
          message: "Another device with the same type and model already exists",
        });
      }
  
      // Update the device if no conflicting device exists
      const updatedDevice = await Device.findByIdAndUpdate(
        req.params.id,
        { deviceType, model },
        { new: true, runValidators: true }
      );
  
      if (!updatedDevice) {
        return res.status(404).json({
          success: false,
          message: "Device not found",
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Device updated successfully",
        data: updatedDevice,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update device",
        error: error.message,
      });
    }
  };
  
  





  
  // 5. Delete a device by ID (DELETE)
  export const deleteDevices = async (req, res) => {
    try {
      const deletedDevice = await Device.findByIdAndDelete(req.params.id);
  
      if (!deletedDevice) {
        return res.status(404).json({
          success: false,
          message: "Device not found",
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Device deleted successfully",
        data: deletedDevice,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete device",
        error: error.message,
      });
    }
  };
  


  export const GetAllWithoutDevices = async (req, res) => {
    try {
      // Fetch all devices without pagination
      const devices = await Device.find();
  
      res.status(200).json({
        success: true,
        message: "Devices retrieved successfully",
        data: devices,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve devices",
        error: error.message,
      });
    }
  };
  