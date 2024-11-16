"use server";

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { redirect } from "next/navigation";
import { Agency, Plan, User } from "@prisma/client";
import { v4 as uuidv4 } from "uuid"; // For generating agencyId if not provided

export const getAuthUserDetails = async () => {
  const user = await currentUser();
  if (!user) {
    return;
  }

  const userData = await db.user.findUnique({
    where: {
      email: user.emailAddresses[0].emailAddress,
    },
    include: {
      Agency: {
        include: {
          SidebarOption: true,
          SubAccount: {
            include: {
              SidebarOption: true,
            },
          },
        },
      },
      Permissions: true,
    },
  });

  return userData;
};

export const createTeamUser = async (agencyId: string, user: User) => {
  if (user.role === "AGENCY_OWNER") return null;
  const response = await db.user.create({ data: { ...user } });
  return response;
};

export const saveActivityLogsNotification = async ({
  agencyId,
  description,
  subaccountId,
}: {
  agencyId?: string;
  description: string;
  subaccountId?: string;
}) => {
  const authUser = await currentUser();
  let userData;
  if (!authUser) {
    const response = await db.user.findFirst({
      where: { Agency: { SubAccount: { some: { id: subaccountId } } } },
    });

    if (response) {
      userData = response;
    }
  } else {
    userData = await db.user.findUnique({
      where: {
        email: authUser?.emailAddresses[0].emailAddress,
      },
    });

    if (userData) {
      console.log("Couldn't find a user");
      return;
    }

    let foundAgencyId = agencyId;
    if (!foundAgencyId) {
      if (!subaccountId) {
        throw new Error(
          "You need to provide atleast an agency Id or subaccount Id"
        );
      }
    }

    const response = await db.subAccount.findUnique({
      where: { id: subaccountId },
    });

    if (response) {
      foundAgencyId = response.agencyId;
    }

    if (subaccountId) {
      await db.notification.create({
        data: {
          notification: `${userData.name} | ${description}`,
          User: {
            connect: {
              id: userData.id,
            },
          },
          Agency: {
            connect: {
              id: foundAgencyId,
            },
          },
          SubAccount: {
            connect: { id: subaccountId },
          },
        },
      });
    } else {
      await db.notification.create({
        data: {
          notification: `${userData.name} | ${description}`,
          User: {
            connect: { id: userData.id },
          },
          Agency: {
            connect: {
              id: foundAgencyId,
            },
          },
        },
      });
    }
  }
};

export const verifyAndAcceptInvitation = async () => {
  const user = await currentUser();
  if (!user) return redirect("/agency/sign-in");
  const invitationExists = await db.invitation.findUnique({
    where: {
      email: user.emailAddresses[0].emailAddress,
      status: "PENDING",
    },
  });

  if (invitationExists) {
    const userDetails = await createTeamUser(invitationExists.agencyId, {
      email: invitationExists.email,
      agencyId: invitationExists.agencyId,
      avatarUrl: user.imageUrl,
      clerkId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      role: invitationExists.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await saveActivityLogsNotification({
      agencyId: invitationExists?.agencyId,
      description: `Joined`,
      subaccountId: undefined,
    });

    if (userDetails) {
      await clerkClient.users.updateUserMetadata(user.id, {
        privateMetaData: {
          role: userDetails.role || `SUBACCOUNT_USER`,
        },
      });

      await db.invitation.delete({
        where: { email: userDetails.email },
      });

      return userDetails.agencyId;
    } else return null;
  } else {
    const agency = await db.user.findUnique({
      where: {
        email: user.emailAddresses[0].emailAddress,
      },
    });

    return agency ? agency.agencyId : null;
  }
};

export const updateAgencyDetails = async (
  agencyId: string,
  agencyDetails: Partial<Agency>
) => {
  const response = await db.agency.update({
    where: { id: agencyId },
    data: { ...agencyDetails },
  });
  return response;
};

export const deleteAgency = async (agencyId: string) => {
  const response = await db.agency.delete({
    where: {
      id: agencyId,
    },
  });
  return response;
};

export const initUser = async (newUser: Partial<User>) => {
  const user = await currentUser();
  if (!user) return;

  const userData = await db.user.upsert({
    where: {
      email: user.emailAddresses[0].emailAddress,
    },
    update: newUser,
    create: {
      clerkId: user.id,
      avatarUrl: user.imageUrl,
      email: user.emailAddresses[0].emailAddress,
      name: `${user.firstName} ${user.lastName}`,
      role: newUser.role || "SUBACCOUNT_USER",
    },
  });

  // await clerkClient.users.updateUserMetadata(user.id, {
  //   privateMetadata: {
  //     role: newUser.role || "SUBACCOUNT_USER",
  //   },
  // });

  return userData;
};

export const upsertAgency = async (agency: Agency) => {
  if (!agency || !agency.agencyId || !agency.name || !agency.companyEmail) {
    console.error("Missing required fields in agency:", agency);
    return null;
  }

  try {
    const agencyId = agency.agencyId || uuidv4();

    console.log("Agency Object to Upsert:", agency);

    const agencyDetails = await db.agency.upsert({
      where: {
        agencyId: agencyId, // Ensure agencyId is valid for the `where` clause
      },
      update: agency, // Update the existing document if it exists
      create: {
        ...agency, // Spread the agency object for creation
        agencyId: agencyId, // Ensure we set a valid agencyId
        SidebarOption: {
          create: [
            {
              name: "Dashboard",
              icon: "category",
              link: `/agency/${agencyId}`, // Use agencyId here instead of agency.id
            },
            {
              name: "Launchpad",
              icon: "clipboardIcon",
              link: `/agency/${agencyId}/launchpad`,
            },
            {
              name: "Billing",
              icon: "payment",
              link: `/agency/${agencyId}/billing`,
            },
            {
              name: "Settings",
              icon: "settings",
              link: `/agency/${agencyId}/settings`,
            },
            {
              name: "Sub Accounts",
              icon: "person",
              link: `/agency/${agencyId}/all-subaccounts`,
            },
            {
              name: "Team",
              icon: "shield",
              link: `/agency/${agencyId}/team`,
            },
          ],
        },
      },
    });

    console.log("Agency upserted successfully:", agencyDetails);
    return agencyDetails;
  } catch (error) {
    console.error("Error during upsert:", error);
    throw new Error("Failed to upsert agency");
  }
};
