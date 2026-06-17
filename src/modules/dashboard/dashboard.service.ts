import { ROLES } from "@/common/utils/roles";
import { prisma } from "@/db/prisma";

export const getDashboardService = async (
  user: any,
  year: number = new Date().getFullYear(),
) => {
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

  // ACTIVE PROJECTS (jo COMPLETED ya CANCELLED nahi hai)
  const activeProjects = await prisma.project.count({
    where: {
      ...projectFilter,
      status: {
        notIn: ["COMPLETED", "CANCELLED"],
      },
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
      const start = new Date(p.startDate);
      const end = new Date(p?.endDate);

      const startYear = start.getFullYear();
      const endYear = end.getFullYear();

      // project selected year ko overlap karna chahiye
      if (year < startYear || year > endYear) return false;

      // months ko selected year ke andar clamp karo
      const startMonth = year === startYear ? start.getMonth() : 0;
      const endMonth = year === endYear ? end.getMonth() : 11;

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
        const endYear = new Date(p?.endDate).getFullYear();

        return (
          endMonth === index && endYear === year && p.status === "COMPLETED"
        );
      })
      .map((p: any) => ({
        projectName: p.name,
        startDate: p.startDate,
        endDate: p.endDate,
      }));

    return {
      month,
      active: active.length,
      completed: completed.length,
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
