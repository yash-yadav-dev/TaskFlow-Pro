package app;

public class Task {
    private int id;
    private String title;
    private String description;
    private String category;
    private String priority;
    private String dueDate;
    private String status;
    private String createdAt;

    public Task(int id, String title, String description, String category,
                String priority, String dueDate, String status, String createdAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.priority = priority;
        this.dueDate = dueDate;
        this.status = status;
        this.createdAt = createdAt;
    }
    public int getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public String getPriority() { return priority; }
    public String getDueDate() { return dueDate; }
    public String getStatus() { return status; }
    public String getCreatedAt() { return createdAt; }
    public boolean isCompleted() { return "DONE".equals(status); }

    public void setTitle(String v) { title = v; }
    public void setDescription(String v) { description = v; }
    public void setCategory(String v) { category = v; }
    public void setPriority(String v) { priority = v; }
    public void setDueDate(String v) { dueDate = v; }
    public void setStatus(String v) { status = v; }
}