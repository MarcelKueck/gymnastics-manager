"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import {
	Calendar,
	Users,
	AlertTriangle,
	CheckCircle,
	Clock,
	UserPlus,
	ClipboardList,
	ChevronRight,
	BarChart3,
	CalendarCheck,
	UserCog,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

interface DashboardData {
	upcomingSessions: {
		id: string;
		date: string;
		name: string;
		startTime: string;
		endTime: string;
		groups: string[];
		attendanceMarked: boolean;
	}[];
	todaysSessions: {
		id: string;
		date: string;
		name: string;
		startTime: string;
		endTime: string;
		groups: string[];
		athleteCount: number;
		attendanceMarked: boolean;
	}[];
	pendingApprovals: number;
	athletesNeedingAttention: {
		id: string;
		name: string;
		absenceCount: number;
		alertDate: string;
	}[];
	stats: {
		sessionsThisWeek: number;
		attendanceMarkedThisWeek: number;
		totalAthletes: number;
		totalTrainers: number;
		totalActiveTrainings: number;
	};
	isAdmin: boolean;
}

export default function TrainerDashboard() {
	const [data, setData] = useState<DashboardData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetch("/api/trainer/dashboard")
			.then((res) => {
				if (!res.ok) throw new Error("Failed to fetch");
				return res.json();
			})
			.then((result) => setData(result.data))
			.catch((err) => setError(err.message))
			.finally(() => setIsLoading(false));
	}, []);

	if (isLoading) return <Loading />;
	if (error)
		return (
			<div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
				Fehler beim Laden: {error}
			</div>
		);
	if (!data)
		return (
			<div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
				Keine Daten verfügbar
			</div>
		);

	const hasTodaysSessions =
		data.todaysSessions && data.todaysSessions.length > 0;
	const unmarkedTodaysSessions =
		data.todaysSessions?.filter((s) => !s.attendanceMarked) || [];

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-semibold sm:text-2xl">
						{data.isAdmin ? "Admin Dashboard" : "Trainer Dashboard"}
					</h1>
					<p className="text-muted-foreground text-sm">
						{format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
					</p>
				</div>
				<div className="flex gap-2">
					<Link href="/trainer/sessions">
						<Button>
							<Calendar className="h-4 w-4 mr-2" />
							Trainings verwalten
						</Button>
					</Link>
				</div>
			</div>

			{/* Today's Sessions Alert */}
			{hasTodaysSessions && (
				<Card
					className={
						unmarkedTodaysSessions.length > 0
							? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
							: "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
					}
				>
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-lg">
							<CalendarCheck
								className={`h-5 w-5 ${
									unmarkedTodaysSessions.length > 0
										? "text-blue-500"
										: "text-emerald-500"
								}`}
							/>
							Heutige Trainings
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{data.todaysSessions.map((session) => (
								<Link key={session.id} href={`/trainer/sessions/${session.id}`}>
									<div className="flex items-center justify-between p-3 rounded-lg bg-background border hover:bg-muted/50 transition-colors">
										<div className="flex items-center gap-3">
											<div className="flex flex-col items-center justify-center w-14 h-14 bg-primary/10 text-primary rounded-lg">
												<Clock className="h-4 w-4" />
												<span className="text-sm font-bold">
													{session.startTime}
												</span>
											</div>
											<div>
												<p className="font-medium">{session.name}</p>
												<div className="flex items-center gap-2 mt-1">
													<span className="text-sm text-muted-foreground">
														{session.startTime} - {session.endTime}
													</span>
													<span className="text-sm text-muted-foreground">
														•
													</span>
													<span className="text-sm text-muted-foreground">
														{session.athleteCount} Athleten
													</span>
												</div>
												<div className="flex gap-1 mt-1">
													{session.groups.map((group) => (
														<Badge key={group} variant="secondary" className="text-xs">
															{group}
														</Badge>
													))}
												</div>
											</div>
										</div>
										<div className="flex items-center gap-2">
											{session.attendanceMarked ? (
												<Badge className="bg-emerald-100 text-emerald-800">
													<CheckCircle className="h-3 w-3 mr-1" />
													Erfasst
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="border-blue-500 text-blue-600"
												>
													<Clock className="h-3 w-3 mr-1" />
													Ausstehend
												</Badge>
											)}
											<ChevronRight className="h-5 w-5 text-muted-foreground" />
										</div>
									</div>
								</Link>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Stats Row */}
			<div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Trainings diese Woche
						</CardTitle>
						<Calendar className="h-5 w-5 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{data.stats.sessionsThisWeek}</div>
						<p className="text-xs text-muted-foreground">
							vergangene Trainings
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Anwesenheit erfasst
						</CardTitle>
						<CheckCircle className="h-5 w-5 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{data.stats.attendanceMarkedThisWeek}
						</div>
						<p className="text-xs text-muted-foreground">diese Woche</p>
					</CardContent>
				</Card>

				<Card className={data.pendingApprovals > 0 ? "border-amber-500" : ""}>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Ausstehende Freigaben
						</CardTitle>
						<UserPlus className="h-5 w-5 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{data.pendingApprovals}</div>
						{data.pendingApprovals > 0 ? (
							<Link href="/trainer/athletes?status=pending">
								<Button variant="link" className="p-0 h-auto text-xs">
									Jetzt prüfen →
								</Button>
							</Link>
						) : (
							<p className="text-xs text-muted-foreground">Keine ausstehend</p>
						)}
					</CardContent>
				</Card>

				<Card className={data.athletesNeedingAttention.length > 0 ? "border-amber-500" : ""}>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Fehlzeiten-Warnungen
						</CardTitle>
						<AlertTriangle className="h-5 w-5 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{data.athletesNeedingAttention.length}
						</div>
						<p className="text-xs text-muted-foreground">
							Athleten mit häufigen Fehlzeiten
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Admin Stats */}
			{data.isAdmin && (
				<div className="grid gap-4 grid-cols-3">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Aktive Athleten
							</CardTitle>
							<Users className="h-5 w-5 text-emerald-500" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{data.stats.totalAthletes}</div>
							<Link href="/trainer/athletes">
								<Button variant="link" className="p-0 h-auto text-xs">
									Verwalten →
								</Button>
							</Link>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Aktive Trainer
							</CardTitle>
							<UserCog className="h-5 w-5 text-blue-500" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{data.stats.totalTrainers}</div>
							<Link href="/trainer/admin/users">
								<Button variant="link" className="p-0 h-auto text-xs">
									Verwalten →
								</Button>
							</Link>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Aktive Trainings
							</CardTitle>
							<Calendar className="h-5 w-5 text-purple-500" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{data.stats.totalActiveTrainings}
							</div>
							<Link href="/trainer/admin/trainings">
								<Button variant="link" className="p-0 h-auto text-xs">
									Verwalten →
								</Button>
							</Link>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Quick Actions */}
			<div className="flex flex-wrap gap-2">
				<Link href="/trainer/sessions">
					<Button variant="outline">
						<ClipboardList className="h-4 w-4 mr-2" />
						Anwesenheit erfassen
					</Button>
				</Link>
				<Link href="/trainer/athletes">
					<Button variant="outline">
						<Users className="h-4 w-4 mr-2" />
						Athleten verwalten
					</Button>
				</Link>
				<Link href="/trainer/statistics">
					<Button variant="outline">
						<BarChart3 className="h-4 w-4 mr-2" />
						Statistiken
					</Button>
				</Link>
				{data.isAdmin && (
					<Link href="/trainer/admin">
						<Button variant="outline">
							<UserCog className="h-4 w-4 mr-2" />
							Administration
						</Button>
					</Link>
				)}
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Upcoming Sessions */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							Anstehende Trainings
							<Link href="/trainer/sessions">
								<Button variant="ghost" size="sm" className="h-8">
									Alle{" "}
									<ChevronRight className="h-4 w-4 ml-1" />
								</Button>
							</Link>
						</CardTitle>
						<CardDescription>Trainings in den nächsten Tagen</CardDescription>
					</CardHeader>
					<CardContent>
						{data.upcomingSessions.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
								<p className="text-muted-foreground">Keine anstehenden Trainings</p>
							</div>
						) : (
							<div className="space-y-3">
								{data.upcomingSessions.slice(0, 5).map((session) => (
									<Link key={session.id} href={`/trainer/sessions/${session.id}`}>
										<div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
											<div className="flex items-center gap-3">
												<div className="flex flex-col items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-lg">
													<span className="text-xs font-medium">
														{format(parseISO(session.date), "EEE", {
															locale: de,
														})}
													</span>
													<span className="font-bold">
														{new Date(session.date).getDate()}
													</span>
												</div>
												<div>
													<p className="font-medium">{session.name}</p>
													<p className="text-sm text-muted-foreground">
														{session.startTime} - {session.endTime}
													</p>
													<div className="flex gap-1 mt-1">
														{session.groups.map((group) => (
															<Badge key={group} variant="secondary" className="text-xs">
																{group}
															</Badge>
														))}
													</div>
												</div>
											</div>
											{session.attendanceMarked ? (
												<CheckCircle className="h-5 w-5 text-emerald-500" />
											) : (
												<Clock className="h-5 w-5 text-muted-foreground" />
											)}
										</div>
									</Link>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Athletes needing attention */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							Fehlzeiten-Warnungen
							<Link href="/trainer/athletes">
								<Button variant="ghost" size="sm" className="h-8">
									Alle{" "}
									<ChevronRight className="h-4 w-4 ml-1" />
								</Button>
							</Link>
						</CardTitle>
						<CardDescription>Athleten mit häufigen Abwesenheiten</CardDescription>
					</CardHeader>
					<CardContent>
						{data.athletesNeedingAttention.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
								<p className="text-muted-foreground">Keine Warnungen vorhanden</p>
								<p className="text-xs text-muted-foreground">
									Alle Athleten haben gute Anwesenheit
								</p>
							</div>
						) : (
							<div className="space-y-3">
								{data.athletesNeedingAttention.map((athlete) => (
									<Link key={athlete.id} href={`/trainer/athletes/${athlete.id}`}>
										<div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
											<div>
												<p className="font-medium">{athlete.name}</p>
												<p className="text-sm text-muted-foreground">
													Warnung vom {formatDate(athlete.alertDate)}
												</p>
											</div>
											<Badge variant="destructive">
												{athlete.absenceCount}x gefehlt
											</Badge>
										</div>
									</Link>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
