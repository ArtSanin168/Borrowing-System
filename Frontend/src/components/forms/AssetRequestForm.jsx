"use client"

import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"

// Validation schema
const AssetRequestSchema = Yup.object().shape({
  purpose: Yup.string()
    .min(10, "Purpose must be at least 10 characters")
    .max(500, "Purpose must be less than 500 characters")
    .required("Purpose is required"),
  startDate: Yup.date()
    .min(new Date(new Date().setHours(0, 0, 0, 0)), "Start date cannot be in the past")
    .required("Start date is required"),
  endDate: Yup.date().min(Yup.ref("startDate"), "End date must be after start date").required("End date is required"),
})

export default function AssetRequestForm({ onSubmit, initialValues, isSubmitting, error }) {
  const defaultValues = {
    purpose: "",
    startDate: "",
    endDate: "",
    ...initialValues,
  }

  const handleSubmit = async (values, actions) => {
    // Format dates to ISO string
    const formattedValues = {
      ...values,
      startDate: values.startDate ? new Date(values.startDate).toISOString() : null,
      endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
    }

    await onSubmit(formattedValues, actions)
  }

  return (
    <Formik initialValues={defaultValues} validationSchema={AssetRequestSchema} onSubmit={handleSubmit}>
      {({ isSubmitting: formikSubmitting, errors, touched }) => (
        <Form className="space-y-4">
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <Field
              as="textarea"
              name="purpose"
              className={`w-full px-3 py-2 border ${
                errors.purpose && touched.purpose ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              rows="3"
              placeholder="Why do you need this asset?"
            />
            <ErrorMessage name="purpose" component="div" className="text-red-500 text-sm mt-1" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Field
                  type="date"
                  name="startDate"
                  className={`w-full px-3 py-2 border ${
                    errors.startDate && touched.startDate ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <ErrorMessage name="startDate" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <span>to</span>
              <div className="flex-1">
                <Field
                  type="date"
                  name="endDate"
                  className={`w-full px-3 py-2 border ${
                    errors.endDate && touched.endDate ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <ErrorMessage name="endDate" component="div" className="text-red-500 text-sm mt-1" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isSubmitting || formikSubmitting}
            >
              {isSubmitting || formikSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  )
}
