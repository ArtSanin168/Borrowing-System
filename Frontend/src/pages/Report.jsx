import { useEffect, useState } from "react";
import api from "../services/api";
import { generateMonthlyBorrowReport } from "../utils/reportUtils";
import { MdAssessment, MdFilterAlt, MdDownload } from "react-icons/md";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import React, { useRef } from 'react';
import { DownloadTableExcel } from 'react-export-table-to-excel';

export default function Report() {
  const [requests, setRequests] = useState([]);
  const [report, setReport] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "asc" });

  // Separate input and applied filter states
  const [monthFilterInput, setMonthFilterInput] = useState("");
  const [departmentFilterInput, setDepartmentFilterInput] = useState("");
  const [itemFilterInput, setItemFilterInput] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [itemFilter, setItemFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const tableRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get("/borrow");
        setRequests(res.data.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setReport(generateMonthlyBorrowReport(requests));
  }, [requests]);

  // Get unique months, departments, and items for dropdowns
  const months = Array.from(new Set(requests
    .filter(r => r.createdAt)
    .map(r => {
      const d = new Date(r.createdAt);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    })
  )).sort((a, b) => new Date(b) - new Date(a));

  const departments = Array.from(new Set(requests
    .map(r => r.user?.department)
    .filter(Boolean)
  )).sort();

  const items = Array.from(new Set(requests
    .map(r => r.item?.name)
    .filter(Boolean)
  )).sort();

  // Filtering logic (use applied filters)
  const filteredRequests = requests
    .filter(req => req.status !== "pending")
    .filter(req => {
      if (monthFilter) {
        const d = new Date(req.createdAt);
        const reqMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (reqMonth !== monthFilter) return false;
      }
      if (departmentFilter && req.user?.department !== departmentFilter) return false;
      if (itemFilter && req.item?.name !== itemFilter) return false;
      return true;
    });

  // Sorting logic
  const sortedRequests = [...filteredRequests]
    .sort((a, b) => {
      const { key, direction } = sortConfig;
      let aValue = a[key];
      let bValue = b[key];

      if (key === "user") {
        aValue = a.user?.name || "";
        bValue = b.user?.name || "";
      }
      if (key === "item") {
        aValue = a.item?.name || "";
        bValue = b.item?.name || "";
      }
      if (key === "approver") {
        aValue = a.approver?.name || "";
        bValue = b.approver?.name || "";
      }
      if (key === "createdAt" || key === "startDate" || key === "endDate") {
        aValue = aValue ? new Date(aValue) : new Date(0);
        bValue = bValue ? new Date(bValue) : new Date(0);
      }
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="ml-1 opacity-30" />;
    return sortConfig.direction === "asc" 
      ? <FaSortUp className="ml-1" /> 
      : <FaSortDown className="ml-1" />;
  };

  // Apply filter handler
  const applyFilters = () => {
    setMonthFilter(monthFilterInput);
    setDepartmentFilter(departmentFilterInput);
    setItemFilter(itemFilterInput);
  };

  // Reset filter handler
  const resetFilters = () => {
    setMonthFilterInput("");
    setDepartmentFilterInput("");
    setItemFilterInput("");
    setMonthFilter("");
    setDepartmentFilter("");
    setItemFilter("");
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <MdAssessment className="inline-block mr-2 text-blue-600" />
          Borrow Requests Report
        </h1>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <MdFilterAlt />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          <DownloadTableExcel
            filename="borrow_requests"
            sheet="requests"
            currentTableRef={tableRef.current}
          >
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <MdDownload />
              Export Excel
            </button>
          </DownloadTableExcel>
        </div>
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select 
                value={monthFilterInput} 
                onChange={e => setMonthFilterInput(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Months</option>
                {months.map(m => (
                  <option key={m} value={m}>
                    {new Date(m + "-01").toLocaleString("default", { month: "long", year: "numeric" })}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select 
                value={departmentFilterInput} 
                onChange={e => setDepartmentFilterInput(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
              <select 
                value={itemFilterInput} 
                onChange={e => setItemFilterInput(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Items</option>
                {items.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button 
                onClick={resetFilters}
                className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
              >
                Reset Filters
              </button>
            </div>
            <div className="flex items-end">
              <button 
                onClick={applyFilters}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Total Requests</h3>
          <p className="text-2xl font-bold text-gray-800">{filteredRequests.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Approved Requests</h3>
          <p className="text-2xl font-bold text-green-600">
            {filteredRequests.filter(r => r.status === "approved").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Rejected Requests</h3>
          <p className="text-2xl font-bold text-red-600">
            {filteredRequests.filter(r => r.status === "rejected").length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" ref={tableRef}>
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center">
                    Request Date
                    {getSortIcon("createdAt")}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("user")}
                >
                  <div className="flex items-center">
                    User
                    {getSortIcon("user")}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("item")}
                >
                  <div className="flex items-center">
                    Item
                    {getSortIcon("item")}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("startDate")}
                >
                  <div className="flex items-center">
                    Duration
                    {getSortIcon("startDate")}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purpose
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    {getSortIcon("status")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedRequests.length > 0 ? (
                sortedRequests.map((req, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span style={{ display: "block" }} className="text-sm text-gray-900">{req.user?.name || "-"} </span>
                      {req.user?.department && (
                        <span className="text-sm text-gray-500">{req.user.department}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.item?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.startDate && req.endDate ? (
                        <>
                          <span className="text-gray-900">
                            {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                          &nbsp;</span>
                          <span style={{ display: "block" }} className="text-gray-500">
                            {(() => {
                              const start = new Date(req.startDate);
                              const end = new Date(req.endDate);
                              const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                              return `${diff} day${diff === 1 ? "" : "s"}`;
                            })()}
                          </span>
                        </>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {req.purpose || req.reason || req.reason_borrow || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        req.status === "approved" 
                          ? "bg-green-100 text-green-800" 
                          : req.status === "rejected" 
                            ? "bg-red-100 text-red-800" 
                            : "bg-gray-100 text-gray-800"
                      }`}>
                        {req.status || "-"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No matching records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}