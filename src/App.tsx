import { BrowserRouter, Routes, Route } from "react-router-dom"
import { DataProvider } from "@/context/DataContext"
import { AutoChecks } from "@/components/AutoChecks"
import Layout from "@/components/Layout"
import Dashboard from "@/pages/Dashboard"
import TodayStudy from "@/pages/TodayStudy"
import DailyLog from "@/pages/DailyLog"
import SubjectsChapters from "@/pages/SubjectsChapters"
import CollegeTracker from "@/pages/CollegeTracker"
import TuitionTracker from "@/pages/TuitionTracker"
import SelfStudyTracker from "@/pages/SelfStudyTracker"
import PendingTopics from "@/pages/PendingTopics"
import RevisionQueue from "@/pages/RevisionQueue"
import WeeklyCatchUp from "@/pages/WeeklyCatchUp"
import Calendar from "@/pages/Calendar"
import Analytics from "@/pages/Analytics"
import Settings from "@/pages/Settings"

function App() {
  return (
    <DataProvider>
      <AutoChecks />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/today" element={<TodayStudy />} />
            <Route path="/log" element={<DailyLog />} />
            <Route path="/subjects" element={<SubjectsChapters />} />
            <Route path="/college" element={<CollegeTracker />} />
            <Route path="/tuition" element={<TuitionTracker />} />
            <Route path="/self-study" element={<SelfStudyTracker />} />
            <Route path="/pending" element={<PendingTopics />} />
            <Route path="/revision" element={<RevisionQueue />} />
            <Route path="/weekly" element={<WeeklyCatchUp />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  )
}

export default App
