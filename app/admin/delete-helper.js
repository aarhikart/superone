import Swal from "sweetalert2";

export async function confirmAndDelete({
  title = "Are you sure?",
  text = "This action cannot be undone.",
  confirmButtonText = "Yes, delete it",
  cancelButtonText = "Cancel",
  deleteFn,
  successTitle = "Deleted!",
  successText = "Item has been deleted successfully.",
  errorTitle = "Error!",
  defaultErrorText = "Unable to delete item."
}) {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    iconColor: "#ef4444",
    background: "#0f172a",
    color: "#f8fafc",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#475569",
    customClass: {
      popup: "rounded-3xl border border-slate-800 shadow-2xl",
      title: "text-2xl font-bold font-sans",
      htmlContainer: "text-slate-400 font-sans",
      confirmButton: "px-5 py-2.5 rounded-xl font-medium focus:ring-2 focus:ring-red-500",
      cancelButton: "px-5 py-2.5 rounded-xl font-medium focus:ring-2 focus:ring-slate-500"
    }
  });

  if (!result.isConfirmed) {
    return false;
  }

  // Show loading indicator
  Swal.fire({
    title: "Deleting...",
    text: "Please wait while we remove this item.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
    background: "#0f172a",
    color: "#f8fafc",
    customClass: {
      popup: "rounded-3xl border border-slate-800 shadow-2xl",
      title: "text-2xl font-bold font-sans",
      htmlContainer: "text-slate-400 font-sans"
    },
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const response = await deleteFn();
    
    let isOk = false;
    let errorMessage = defaultErrorText;

    if (response && typeof response === "object") {
      if (typeof response.ok === "boolean") {
        isOk = response.ok;
        if (!isOk) {
          try {
            const data = await response.clone().json();
            errorMessage = data.error || defaultErrorText;
          } catch (e) {
            errorMessage = response.statusText || defaultErrorText;
          }
        }
      } else {
        isOk = response.success !== false;
        errorMessage = response.error || defaultErrorText;
      }
    } else {
      isOk = !!response;
    }

    if (isOk) {
      await Swal.fire({
        title: successTitle,
        text: successText,
        icon: "success",
        iconColor: "#10b981",
        background: "#0f172a",
        color: "#f8fafc",
        confirmButtonColor: "#10b981",
        customClass: {
          popup: "rounded-3xl border border-slate-800 shadow-2xl",
          title: "text-2xl font-bold font-sans",
          htmlContainer: "text-slate-400 font-sans",
          confirmButton: "px-5 py-2.5 rounded-xl font-medium"
        }
      });
      return { success: true };
    } else {
      await Swal.fire({
        title: errorTitle,
        text: errorMessage,
        icon: "error",
        iconColor: "#ef4444",
        background: "#0f172a",
        color: "#f8fafc",
        confirmButtonColor: "#ef4444",
        customClass: {
          popup: "rounded-3xl border border-slate-800 shadow-2xl",
          title: "text-2xl font-bold font-sans",
          htmlContainer: "text-slate-400 font-sans",
          confirmButton: "px-5 py-2.5 rounded-xl font-medium"
        }
      });
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    const errorMsg = error.message || defaultErrorText;
    await Swal.fire({
      title: errorTitle,
      text: errorMsg,
      icon: "error",
      iconColor: "#ef4444",
      background: "#0f172a",
      color: "#f8fafc",
      confirmButtonColor: "#ef4444",
      customClass: {
        popup: "rounded-3xl border border-slate-800 shadow-2xl",
        title: "text-2xl font-bold font-sans",
        htmlContainer: "text-slate-400 font-sans",
        confirmButton: "px-5 py-2.5 rounded-xl font-medium"
      }
    });
    return { success: false, error: errorMsg };
  }
}
