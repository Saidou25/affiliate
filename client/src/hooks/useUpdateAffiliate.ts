import { useMutation } from "@apollo/client";
import { UPDATE_AFFILIATE } from "../utils/mutations";
import { Affiliate } from "../types";

type EditableProfile = {
  name?: string;
  email?: string;
  avatar?: string;
};

const useUpdateAffiliate = () => {
  const [updateAffiliate, { loading: updating, error: updateError }] =
    useMutation(UPDATE_AFFILIATE);

  const update = async (tempProfile: EditableProfile, me: Affiliate) => {
    if (!me?.id) return;
    try {
      const res = await updateAffiliate({
        variables: {
          id: me.id,
          name: tempProfile.name,
          email: tempProfile.email,
          avatar: tempProfile.avatar,
        },
      });
      if (res) {
        return res?.data?.updateAffiliate ?? null; //  returns the affiliate object or null
      }
    } catch (error) {
      console.error("❌ Update failed:", error);
      throw error;
    }
  };

  return { update, updating, updateError };
};
export default useUpdateAffiliate;
