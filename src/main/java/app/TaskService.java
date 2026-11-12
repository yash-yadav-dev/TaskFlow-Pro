package app;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.OffsetDateTime;
import java.util.*;

public class TaskService {
    private final List<Task> tasks = new ArrayList<>();
    private final Path file = Paths.get("data", "tasks.csv");
    private int nextId = 1;

    public TaskService() {
        try {
            Files.createDirectories(file.getParent());
            if (Files.exists(file)) {
                for (String line : Files.readAllLines(file, StandardCharsets.UTF_8)) {
                    if (line.isBlank()) continue;
                    String[] p = line.split("\\t", -1);
                    try {
                        if (p.length == 4) { // upgrade records from the original TaskFlow version
                            Task t = new Task(Integer.parseInt(p[0]), dec(p[1]), dec(p[2]),
                                "Personal", "MEDIUM", "", Boolean.parseBoolean(p[3]) ? "DONE" : "TODO",
                                OffsetDateTime.now().toString());
                            tasks.add(t);
                        } else if (p.length == 8) {
                            Task t = new Task(Integer.parseInt(p[0]), dec(p[1]), dec(p[2]), dec(p[3]),
                                dec(p[4]), dec(p[5]), dec(p[6]), dec(p[7]));
                            tasks.add(t);
                        } else continue;
                        nextId = Math.max(nextId, tasks.get(tasks.size()-1).getId() + 1);
                    } catch (Exception ignored) { }
                }
            }
            save();
        } catch (Exception e) {
            System.err.println("Could not load saved tasks: " + e.getMessage());
        }
    }

    public synchronized List<Task> getAll() { return new ArrayList<>(tasks); }

    public synchronized Task add(Map<String,String> p) {
        String title = clean(p.get("title"));
        if (title.isEmpty()) throw new IllegalArgumentException("A task title is required.");
        Task t = new Task(nextId++, title, clean(p.get("description")),
            value(p.get("category"), "Personal"),
            valid(p.get("priority"), List.of("LOW","MEDIUM","HIGH","URGENT"), "MEDIUM"),
            clean(p.get("dueDate")),
            valid(p.get("status"), List.of("TODO","IN_PROGRESS","DONE"), "TODO"),
            OffsetDateTime.now().toString());
        tasks.add(t); save(); return t;
    }

    public synchronized boolean update(int id, Map<String,String> p) {
        Task t = find(id);
        if (t == null) return false;
        String title = clean(p.get("title"));
        if (title.isEmpty()) throw new IllegalArgumentException("A task title is required.");
        t.setTitle(title);
        t.setDescription(clean(p.get("description")));
        t.setCategory(value(p.get("category"), t.getCategory()));
        t.setPriority(valid(p.get("priority"), List.of("LOW","MEDIUM","HIGH","URGENT"), t.getPriority()));
        t.setDueDate(clean(p.get("dueDate")));
        t.setStatus(valid(p.get("status"), List.of("TODO","IN_PROGRESS","DONE"), t.getStatus()));
        save(); return true;
    }

    public synchronized boolean delete(int id) {
        boolean removed = tasks.removeIf(t -> t.getId() == id);
        if (removed) save();
        return removed;
    }

    public synchronized int importTasks(List<Map<String,String>> incoming) {
        int count = 0;
        for (Map<String,String> p : incoming) {
            if (clean(p.get("title")).isEmpty()) continue;
            add(p); count++;
        }
        return count;
    }

    private Task find(int id) {
        for (Task t : tasks) if (t.getId() == id) return t;
        return null;
    }
    private String clean(String s) { return s == null ? "" : s.trim(); }
    private String value(String s, String fallback) { return clean(s).isEmpty() ? fallback : clean(s); }
    private String valid(String s, List<String> allowed, String fallback) {
        String v = clean(s).toUpperCase(Locale.ROOT);
        return allowed.contains(v) ? v : fallback;
    }
    private String enc(String s) { return Base64.getEncoder().encodeToString(s.getBytes(StandardCharsets.UTF_8)); }
    private String dec(String s) { return new String(Base64.getDecoder().decode(s), StandardCharsets.UTF_8); }

    private void save() {
        try {
            List<String> lines = new ArrayList<>();
            for (Task t : tasks) {
                lines.add(t.getId() + "\t" + enc(t.getTitle()) + "\t" + enc(t.getDescription()) + "\t" +
                    enc(t.getCategory()) + "\t" + enc(t.getPriority()) + "\t" + enc(t.getDueDate()) + "\t" +
                    enc(t.getStatus()) + "\t" + enc(t.getCreatedAt()));
            }
            Files.write(file, lines, StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException e) { throw new RuntimeException("Could not save tasks: " + e.getMessage()); }
    }
}