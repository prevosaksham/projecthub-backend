import { ROLES } from "@/common/utils/roles";
import { prisma } from "@/db/prisma";

export const getDashboardService = async (user: any) => {
  // BASE FILTER
  const projectFilter: any = {
    isDeleted: false,
    isEnabled: true,
  };
  if (user.role === ROLES.ADMIN) {
    projectFilter.createdById = user.id;
  }
  if (user.role === ROLES.MANAGER) {
    // Only assigned projects
    projectFilter.members = {
      some: {
        assignedToId: user.id,
        isDeleted: false,
      },
    };
  }
  if (user.role === ROLES.LEADERSHIP) {
    // Created OR Assigned projects
    projectFilter.OR = [
      {
        createdById: user.id,
      },
      {
        members: {
          some: {
            assignedToId: user.id,
            isDeleted: false,
          },
        },
      },
    ];
  }
  // TOTAL PROJECTS
  const totalProjects = await prisma.project.count({
    where: projectFilter,
  });

  // ACTIVE PROJECTS
  const activeProjects = await prisma.project.count({
    where: {
      ...projectFilter,
      status: "IN_PROGRESS",
    },
  });

  // COMPLETED PROJECTS
  const completedProjects = await prisma.project.count({
    where: {
      ...projectFilter,
      status: "COMPLETED",
    },
  });

  // MONTHLY GRAPH DATA
  const projects = await prisma.project.findMany({
    where: projectFilter,

    select: {
      name: true,
      startDate: true,
      endDate: true,
      status: true,
    },
  });

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const graphData = months.map((month, index) => {
    const active = projects.filter((p: any) => {
      const startMonth = new Date(p.startDate).getMonth();

      const endMonth = new Date(p?.endDate).getMonth();

      return (
        index >= startMonth &&
        index <= endMonth &&
        p.status !== "COMPLETED" &&
        p.status !== "CANCELLED"
      );
    });

    const completed = projects
      .filter((p: any) => {
        const endMonth = new Date(p?.endDate).getMonth();

        return endMonth === index && p.status === "COMPLETED";
      })
      .map((p: any) => ({
        projectName: p.name,
        startDate: p.startDate,
        endDate: p.endDate,
      }));

    return {
      month,
      active: active.length,
      completedProject: completed.length,
      activeProject: active,
      completedProjects: completed,
    };
  });

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    graphData,
  };
};
