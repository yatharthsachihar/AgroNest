import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { userApi } from "../../api/userApi";
import toast from "react-hot-toast";

export function useCustomers() {
  const queryClient = useQueryClient();

  // Query to get all customers
  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: () => userApi.getAll().then(r => r.data),
  });

  // Listen for realtime customer events (like account deletion from frontend)
  useEffect(() => {
    const handleNotification = (e) => {
      const notif = e.detail;
      if (notif?.type === "customer") {
        queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      }
    };
    window.addEventListener("new-notification", handleNotification);
    return () => window.removeEventListener("new-notification", handleNotification);
  }, [queryClient]);

  // Mutation to update customer status
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Optimistic update for instant UI feedback
      await queryClient.cancelQueries({ queryKey: ["admin-customers"] });
      const previousCustomers = queryClient.getQueryData(["admin-customers"]);
      queryClient.setQueryData(["admin-customers"], (old) => {
        if (!old) return old;
        return old.map(user => user._id === id ? { ...user, ...data } : user);
      });
      return { previousCustomers };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      const updatedUser = res.data;
      if (updatedUser.isActive) {
        toast.success(`Account for "${updatedUser.fullName}" is now Active`);
      } else {
        toast.success(`Account for "${updatedUser.fullName}" is now Inactive`);
      }
    },
    onError: (err, variables, context) => {
      if (context?.previousCustomers) {
        queryClient.setQueryData(["admin-customers"], context.previousCustomers);
      }
      toast.error(err?.response?.data?.message || "Failed to update customer status");
    },
  });

  // Mutation to soft-delete/deactivate customer
  const deactivateMutation = useMutation({
    mutationFn: (id) => userApi.remove(id),
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["admin-customers"] });
      const previousCustomers = queryClient.getQueryData(["admin-customers"]);
      queryClient.setQueryData(["admin-customers"], (old) => {
        if (!old) return old;
        return old.map(user => user._id === id ? { ...user, isActive: false } : user);
      });
      return { previousCustomers };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      toast.success("Customer account deactivated successfully");
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["admin-customers"], context.previousCustomers);
      toast.error(err?.response?.data?.message || "Failed to deactivate customer");
    },
  });

  const toggleActive = (id, isCurrentlyActive) => {
    updateMutation.mutate({ id, data: { isActive: !isCurrentlyActive } });
  };

  const removeCustomer = (id) => {
    deactivateMutation.mutate(id);
  };

  return {
    customers,
    isLoading,
    error,
    toggleActive,
    removeCustomer,
    isUpdating: updateMutation.isPending,
    isRemoving: deactivateMutation.isPending,
  };
}
